const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJSON, saveJSON } = require('../storage');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credito-otorgar')
    .setDescription('Otorga un crédito Coppel a un usuario.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((o) =>
      o.setName('nombre_ic').setDescription('Nombre IC con apellidos').setRequired(true)
    )
    .addUserOption((o) =>
      o.setName('usuario').setDescription('Usuario de Discord').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('usuario_roblox').setDescription('Usuario de Roblox').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('edad').setDescription('Edad del usuario').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('identificador')
        .setDescription('Identificador de crédito (Ej: C-100000)')
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('limite').setDescription('Límite de crédito (Ej: $5,000)').setRequired(true)
    ),

  async execute(interaction) {
    const nombreIC = interaction.options.getString('nombre_ic');
    const target = interaction.options.getUser('usuario');
    const usuarioRoblox = interaction.options.getString('usuario_roblox');
    const edad = interaction.options.getInteger('edad');
    const identificador = interaction.options.getString('identificador');
    const limite = interaction.options.getString('limite');

    const credits = loadJSON('credits.json', {});

    // El identificador no se puede reutilizar mientras esté activo en otro crédito
    const yaUsado = Object.entries(credits).find(
      ([uid, c]) => c.activo && c.identificador?.toLowerCase() === identificador.toLowerCase() && uid !== target.id
    );
    if (yaUsado) {
      return interaction.reply({
        content: `❌ El identificador **${identificador}** ya está en uso por un crédito activo. Remuévelo primero con /credito-remover.`,
        ephemeral: true,
      });
    }

    credits[target.id] = {
      nombreIC,
      usuarioDiscordId: target.id,
      usuarioRoblox,
      edad,
      activo: true,
      identificador,
      limite,
      otorgadoPorId: interaction.user.id,
      otorgadoPorTag: interaction.user.tag,
      fecha: new Date().toISOString(),
    };
    saveJSON('credits.json', credits);

    const successEmbed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Crédito otorgado correctamente')
      .addFields(
        { name: 'Usuario', value: `<@${target.id}>` },
        { name: 'Identificador', value: identificador }
      );
    await interaction.reply({ embeds: [successEmbed], ephemeral: true });

    // Log
    const logChannel = await interaction.client.channels
      .fetch(config.logsChannelId)
      .catch(() => null);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('💳 Crédito Coppel Otorgado')
        .addFields(
          { name: 'Nombre IC', value: nombreIC, inline: true },
          { name: 'Usuario', value: `<@${target.id}>`, inline: true },
          { name: 'Usuario de Roblox', value: usuarioRoblox, inline: true },
          { name: 'Edad', value: String(edad), inline: true },
          { name: 'Identificador de Crédito', value: identificador, inline: true },
          { name: 'Límite de Crédito', value: limite, inline: true },
          { name: 'Otorgado por', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    // DM al usuario
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ CREDITO COPPEL APROBADO')
      .addFields(
        { name: 'Nombre IC', value: nombreIC, inline: true },
        { name: 'Usuario de Roblox', value: usuarioRoblox, inline: true },
        { name: 'Edad', value: String(edad), inline: true },
        { name: 'Identificador de Crédito', value: identificador, inline: true },
        { name: 'Límite de Crédito', value: limite, inline: true },
        { name: 'Otorgado por', value: interaction.user.tag, inline: true }
      )
      .setFooter({ text: 'Soporte Coppel' })
      .setTimestamp();
    target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
