const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJSON } = require('../storage');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil-revisar')
    .setDescription('Revisa el perfil de crédito de un usuario.')
    .addUserOption((opt) =>
      opt.setName('usuario').setDescription('Usuario a revisar').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const credits = loadJSON('credits.json', {});
    const data = credits[target.id];

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`📋 Perfil de Crédito — ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    if (!data) {
      embed.setDescription('Este usuario no tiene ningún crédito registrado.');
    } else {
      embed.addFields(
        { name: 'Nombre IC', value: data.nombreIC || 'N/A', inline: true },
        { name: 'Usuario', value: `<@${data.usuarioDiscordId}>`, inline: true },
        { name: 'Usuario de Roblox', value: data.usuarioRoblox || 'N/A', inline: true },
        { name: 'Edad', value: String(data.edad ?? 'N/A'), inline: true },
        { name: '¿Crédito Activo?', value: data.activo ? '✅ Sí' : '❌ No', inline: true },
        { name: 'Identificador de Crédito', value: data.identificador || 'N/A', inline: true },
        { name: 'Límite de Crédito', value: data.limite || 'N/A', inline: true },
        { name: 'Otorgado por', value: data.otorgadoPorTag || 'N/A', inline: true }
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
