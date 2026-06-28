const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { loadJSON } = require('../storage');
const { buildStatusEmbed, buildStatusPanelComponents } = require('../handlers/status');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel-estatus')
    .setDescription('Envía el panel de estatus de soporte (Abierto/Cerrado/Mantenimiento).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = await interaction.client.channels
      .fetch(config.statusPanelChannelId)
      .catch(() => null);

    if (!channel) {
      return interaction.reply({
        content: '❌ No se pudo encontrar el canal del panel de estatus. Revisa el ID en config.js.',
        ephemeral: true,
      });
    }

    const statusData = loadJSON('status.json', { state: 'abierto' });

    await channel.send({
      embeds: [buildStatusEmbed(statusData.state)],
      components: buildStatusPanelComponents(statusData.state),
    });

    await interaction.reply({
      content: `✅ Panel de estatus enviado a <#${config.statusPanelChannelId}>.`,
      ephemeral: true,
    });
  },
};
