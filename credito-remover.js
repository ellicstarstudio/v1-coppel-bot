const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJSON, saveJSON } = require('../storage');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credito-remover')
    .setDescription('Remueve el crédito Coppel de un usuario.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((o) => o.setName('nombre_ic').setDescription('Nombre IC').setRequired(true))
    .addUserOption((o) =>
      o.setName('usuario').setDescription('Usuario de Discord').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('usuario_roblox').setDescription('Usuario de Roblox').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('identificador').setDescription('Identificador de crédito anterior').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('motivo').setDescription('Motivo de la remoción').setRequired(true)
    ),

  async execute(interaction) {
    const nombreIC = interaction.options.getString('nombre_ic');
    const target = interaction.options.getUser('usuario');
    const usuarioRoblox = interaction.options.getString('usuario_roblox');
    const identificador = interaction.options.getString('identificador');
    const motivo = interaction.options.getString('motivo');

    const credits = loadJSON('credits.json', {});
    const data = credits[target.id];

    if (!data || !data.activo) {
      return interaction.reply({
        content: '❌ Este usuario no tiene un crédito activo registrado.',
        ephemeral: true,
      });
    }
    if (data.identificador.toLowerCase() !== identificador.toLowerCase()) {
      return interaction.reply({
        content: `❌ El identificador proporcionado no coincide con el registrado (**${data.identificador}**).`,
        ephemeral: true,
      });
    }

    data.activo = false;
    data.removidoPorId = interaction.user.id;
    data.removidoPorTag = interaction.user.tag;
    data.motivoRemocion = motivo;
    data.fechaRemocion = new Date().toISOString();
    credits[target.id] = data;
    saveJSON('credits.json', credits);

    await interaction.reply({
      content: `✅ Crédito de <@${target.id}> removido correctamente.`,
      ephemeral: true,
    });

    // Log
    const logChannel = await interaction.client.channels
      .fetch(config.logsChannelId)
      .catch(() => null);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('❌ Crédito Coppel Removido')
        .addFields(
          { name: 'Nombre IC', value: nombreIC, inline: true },
          { name: 'Usuario', value: `<@${target.id}>`, inline: true },
          { name: 'Usuario de Roblox', value: usuarioRoblox, inline: true },
          { name: 'Identificador Anterior', value: identificador, inline: true },
          { name: 'Motivo', value: motivo },
          { name: 'Removido por', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    // DM al ex-creditante
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setTitle('❌ CRÉDITO COPPEL REMOVIDO')
      .addFields(
        { name: 'Nombre IC', value: nombreIC, inline: true },
        { name: 'Usuario de Roblox', value: usuarioRoblox, inline: true },
        { name: 'Identificador Anterior', value: identificador, inline: true },
        { name: 'Motivo', value: motivo },
        { name: 'Removido por', value: interaction.user.tag, inline: true }
      )
      .setFooter({ text: 'Soporte Coppel' })
      .setTimestamp();
    target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
