const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { loadJSON, saveJSON } = require('../storage');
const config = require('../config');

// Construye los botones + menú de "mover categoría" para el panel de gestión del ticket
function buildTicketComponents(currentCategoryKey, claimed = false) {
  const buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('CERRAR TICKET')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('RECLAMAR TICKET')
      .setEmoji('🗝️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(claimed)
  );

  const moveOptions = Object.entries(config.categories)
    .filter(([key]) => key !== currentCategoryKey)
    .map(([key, cat]) => ({ label: cat.name, value: key, emoji: cat.emoji }));

  const moveRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_move_category')
      .setPlaceholder('📁 Mover ticket de categoría')
      .addOptions(moveOptions)
  );

  return [buttonsRow, moveRow];
}

// Cuando un usuario elige una categoría en el panel principal
async function handleCategorySelect(interaction) {
  const categoryKey = interaction.values[0];
  const category = config.categories[categoryKey];
  if (!category) {
    return interaction.reply({ content: '❌ Categoría no válida.', ephemeral: true });
  }

  const tickets = loadJSON('tickets.json', {});
  const existing = Object.entries(tickets).find(
    ([, t]) => t.userId === interaction.user.id && t.open
  );
  if (existing) {
    return interaction.reply({
      content: `❌ Ya tienes un ticket abierto: <#${existing[0]}>`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 20) || 'usuario';

  let channel;
  try {
    channel = await guild.channels.create({
      name: `ticket-${safeName}`,
      type: ChannelType.GuildText,
      parent: category.categoryId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: config.staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });
  } catch (err) {
    console.error(err);
    return interaction.editReply({
      content:
        '❌ No pude crear el canal del ticket. Revisa que el bot tenga permiso "Gestionar canales" y que la categoría tenga espacio (máx. 50 canales).',
    });
  }

  const now = new Date();
  tickets[channel.id] = {
    userId: interaction.user.id,
    categoryKey,
    claimedBy: null,
    open: true,
    createdAt: now.toISOString(),
  };
  saveJSON('tickets.json', tickets);

  const fecha = now.toLocaleDateString('es-MX');
  const hora = now.toLocaleTimeString('es-MX');

  const welcomeEmbed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setDescription(
      `Bienvenido ${interaction.user} a tu ticket de la categoría **${category.name}**, ve contándonos la situación por la cual aperturas ticket en lo que un miembro del equipo administrativo te atiende.`
    )
    .setFooter({ text: `Soporte Coppel | Fecha: ${fecha} | Hora: ${hora}` });

  // Ping al usuario que abrió el ticket + al rol de staff
  await channel.send({
    content: `${interaction.user} | <@&${config.staffRoleId}>`,
    embeds: [welcomeEmbed],
    components: buildTicketComponents(categoryKey, false),
  });

  await interaction.editReply({ content: `✅ Tu ticket fue creado: ${channel}` });
}

// Botón "RECLAMAR TICKET"
async function handleClaim(interaction) {
  if (!interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({
      content: '❌ Solo el staff puede reclamar tickets.',
      ephemeral: true,
    });
  }

  const tickets = loadJSON('tickets.json', {});
  const ticket = tickets[interaction.channel.id];
  if (!ticket) {
    return interaction.reply({ content: '❌ Este canal no es un ticket válido.', ephemeral: true });
  }
  if (ticket.claimedBy) {
    return interaction.reply({
      content: `❌ Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`,
      ephemeral: true,
    });
  }

  ticket.claimedBy = interaction.user.id;
  saveJSON('tickets.json', tickets);

  // Deshabilita el botón de reclamar en el mensaje original
  await interaction.update({ components: buildTicketComponents(ticket.categoryKey, true) });

  const claimedEmbed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('| | Ticket Reclamado | |')
    .addFields({ name: 'Reclamado por', value: `${interaction.user}` })
    .setDescription('Agradecemos tu servicio y amabilidad en este ticket.');

  await interaction.channel.send({ embeds: [claimedEmbed] });
}

// Botón "CERRAR TICKET"
async function handleClose(interaction) {
  if (!interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({
      content: '❌ Solo el staff puede cerrar tickets.',
      ephemeral: true,
    });
  }

  const tickets = loadJSON('tickets.json', {});
  const ticket = tickets[interaction.channel.id];
  if (!ticket) {
    return interaction.reply({ content: '❌ Este canal no es un ticket válido.', ephemeral: true });
  }

  await interaction.reply({ content: '🔒 Cerrando este ticket en 5 segundos...' });

  const category = config.categories[ticket.categoryKey];

  const logChannel = await interaction.client.channels.fetch(config.logsChannelId).catch(() => null);
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setTitle('🔒 Ticket Cerrado')
      .addFields(
        { name: 'Canal', value: `#${interaction.channel.name}`, inline: true },
        { name: 'Categoría', value: category?.name || 'N/A', inline: true },
        { name: 'Abierto por', value: `<@${ticket.userId}>`, inline: true },
        {
          name: 'Reclamado por',
          value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Nadie',
          inline: true,
        },
        { name: 'Cerrado por', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp();
    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
  }

  const ticketUser = await interaction.client.users.fetch(ticket.userId).catch(() => null);
  if (ticketUser) {
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setTitle('🔒 Tu ticket ha sido cerrado')
      .setDescription(
        `Tu ticket de la categoría **${category?.name || 'N/A'}** se ha cerrado de manera exitosa. ¡Gracias por contactar a Soporte Coppel!`
      );
    ticketUser.send({ embeds: [dmEmbed] }).catch(() => {});
  }

  ticket.open = false;
  saveJSON('tickets.json', tickets);

  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 5000);
}

// Menú desplegable "Mover ticket de Categoría"
async function handleMoveSelect(interaction) {
  if (!interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({
      content: '❌ Solo el staff puede mover tickets de categoría.',
      ephemeral: true,
    });
  }

  const newKey = interaction.values[0];
  const newCategory = config.categories[newKey];
  if (!newCategory) {
    return interaction.reply({ content: '❌ Categoría no válida.', ephemeral: true });
  }

  const tickets = loadJSON('tickets.json', {});
  const ticket = tickets[interaction.channel.id];
  if (!ticket) {
    return interaction.reply({ content: '❌ Este canal no es un ticket válido.', ephemeral: true });
  }

  const oldCategory = config.categories[ticket.categoryKey];

  await interaction.channel.setParent(newCategory.categoryId, { lockPermissions: false }).catch(() => {});

  ticket.categoryKey = newKey;
  saveJSON('tickets.json', tickets);

  // Actualiza el menú del mensaje original para que ya no muestre la categoría actual como opción
  await interaction.update({ components: buildTicketComponents(newKey, !!ticket.claimedBy) });

  const moveEmbed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('| | TICKET MOVIDO DE CATEGORÍA!! | |')
    .addFields(
      { name: 'Categoría Anterior', value: oldCategory?.name || 'N/A', inline: true },
      { name: 'Categoría Actual', value: newCategory.name, inline: true },
      { name: 'Movido por', value: `${interaction.user}`, inline: true }
    )
    .setImage(config.movedImageUrl);

  await interaction.channel.send({
    content: `<@&${config.staffRoleId}>`,
    embeds: [moveEmbed],
  });
}

module.exports = {
  buildTicketComponents,
  handleCategorySelect,
  handleClaim,
  handleClose,
  handleMoveSelect,
};
