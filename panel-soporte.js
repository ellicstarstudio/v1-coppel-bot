const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel-soporte')
    .setDescription('Envía el panel de soporte y tickets al canal configurado.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = await interaction.client.channels
      .fetch(config.panelChannelId)
      .catch(() => null);

    if (!channel) {
      return interaction.reply({
        content: '❌ No se pudo encontrar el canal del panel. Revisa el ID en config.js.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🛎️ Panel de Servicio al Cliente – Coppel')
      .setDescription(
        '📞 **Línea de Atención al Cliente**\n800 220 7735\n\n' +
          '🏬 **Atención en Sucursales**\n' +
          'Recibe atención personalizada en cualquier tienda Coppel presentando una identificación oficial, si es requerida.\n\n' +
          '🎫 **Soporte por Ticket**\n' +
          'Utiliza este canal para reportar cualquier situación relacionada con:\n\n' +
          '🛍️ Compras en tienda o en línea.\n' +
          '💳 Créditos Coppel.\n' +
          '📦 Estado de pedidos.\n' +
          '🔄 Cambios y devoluciones.\n' +
          '⚠️ Reportes de incidencias.\n' +
          '❓ Dudas o aclaraciones generales.\n\n' +
          '👇 Selecciona una categoría en el menú de abajo para abrir tu ticket.'
      )
      .setFooter({ text: 'Soporte Coppel' })
      .setTimestamp();

    const options = Object.entries(config.categories).map(([key, cat]) => ({
      label: cat.name,
      value: key,
      emoji: cat.emoji,
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_select_category')
        .setPlaceholder('📂 Selecciona el motivo de tu ticket')
        .addOptions(options)
    );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: `✅ Panel enviado correctamente a <#${config.panelChannelId}>.`,
      ephemeral: true,
    });
  },
};
