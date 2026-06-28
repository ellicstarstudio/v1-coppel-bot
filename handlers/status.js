const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadJSON, saveJSON } = require('../storage');
const config = require('../config');

function buildStatusPanelComponents(currentState) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('estatus_abierto')
      .setLabel('Abierto')
      .setEmoji('🟢')
      .setStyle(ButtonStyle.Success)
      .setDisabled(currentState === 'abierto'),
    new ButtonBuilder()
      .setCustomId('estatus_cerrado')
      .setLabel('Cerrado')
      .setEmoji('🔴')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(currentState === 'cerrado'),
    new ButtonBuilder()
      .setCustomId('estatus_mantenimiento')
      .setLabel('Mantenimiento')
      .setEmoji('🟡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentState === 'mantenimiento')
  );
  return [row];
}

function buildStatusEmbed(currentState) {
  const info = config.supportStatus[currentState];
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('| PANEL DE SOPORTE |')
    .setDescription(
      'Este panel actualiza el estado del soporte y se puede utilizar para actualizarlo y hacer saber a los clientes de ello.\n\n' +
        `**Estado actual:** ${info.emoji} ${info.label}`
    )
    .setFooter({ text: 'Soporte Coppel' })
    .setTimestamp();
}

async function handleStatusButton(interaction, newState) {
  if (!interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({
      content: '❌ Solo el staff puede cambiar el estado del soporte.',
      ephemeral: true,
    });
  }

  const statusData = loadJSON('status.json', { state: 'abierto' });
  if (statusData.state === newState) {
    return interaction.reply({
      content: `ℹ️ El estado ya está en **${config.supportStatus[newState].label}**.`,
      ephemeral: true,
    });
  }

  statusData.state = newState;
  saveJSON('status.json', statusData);

  const info = config.supportStatus[newState];

  // Actualiza el panel (embed + botones) en el mismo mensaje
  await interaction.update({
    embeds: [buildStatusEmbed(newState)],
    components: buildStatusPanelComponents(newState),
  });

  // Renombra el canal de voz según el nuevo estatus
  const vc = await interaction.client.channels.fetch(config.statusVoiceChannelId).catch(() => null);
  if (vc) vc.setName(info.vcName).catch(() => {});

  // Manda el anuncio con @everyone al canal configurado
  const announceChannel = await interaction.client.channels
    .fetch(config.statusAnnounceChannelId)
    .catch(() => null);
  if (announceChannel) {
    announceChannel
      .send({
        content: `@everyone\n${info.announce}`,
        allowedMentions: { parse: ['everyone'] },
      })
      .catch(() => {});
  }
}

module.exports = { handleStatusButton, buildStatusPanelComponents, buildStatusEmbed };
