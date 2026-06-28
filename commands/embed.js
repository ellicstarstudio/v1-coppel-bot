const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Crea y envía un embed personalizado en un canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o.setName('canal').setDescription('Canal de destino').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('titulo').setDescription('Título del embed').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('descripcion')
        .setDescription('Descripción del embed (usa \\n para saltos de línea)')
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('color').setDescription('Color en hexadecimal (Ej: #0047AB)').setRequired(false)
    )
    .addStringOption((o) =>
      o.setName('imagen').setDescription('URL de imagen grande').setRequired(false)
    )
    .addStringOption((o) =>
      o.setName('thumbnail').setDescription('URL de imagen pequeña').setRequired(false)
    )
    .addStringOption((o) =>
      o.setName('footer').setDescription('Texto del footer').setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    const titulo = interaction.options.getString('titulo');
    const descripcion = interaction.options.getString('descripcion').replace(/\\n/g, '\n');
    const colorInput = interaction.options.getString('color');
    const imagen = interaction.options.getString('imagen');
    const thumbnail = interaction.options.getString('thumbnail');
    const footer = interaction.options.getString('footer');

    if (!channel.isTextBased()) {
      return interaction.reply({ content: '❌ Debes seleccionar un canal de texto.', ephemeral: true });
    }

    const embed = new EmbedBuilder().setTitle(titulo).setDescription(descripcion).setTimestamp();

    try {
      embed.setColor(colorInput || config.colors.primary);
    } catch {
      embed.setColor(config.colors.primary);
    }

    if (imagen) embed.setImage(imagen);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({ text: footer });

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Embed enviado en <#${channel.id}>.`, ephemeral: true });
  },
};
