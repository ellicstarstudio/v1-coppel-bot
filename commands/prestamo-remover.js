const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJSON, saveJSON } = require('../storage');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prestamo-remover')
    .setDescription('Remueve/cierra un préstamo Coppel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((o) =>
      o.setName('nombres_ic').setDescription('Nombres IC del cliente').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('apellidos_ic').setDescription('Apellidos IC del cliente').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('id_publicacion').setDescription('ID de la publicación del préstamo').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('motivo')
        .setDescription('Motivo de la remoción')
        .setRequired(true)
        .addChoices(
          { name: 'PAGO', value: 'PAGO' },
          { name: 'ERROR', value: 'ERROR' },
          { name: 'CANCELADO', value: 'CANCELADO' }
        )
    )
    .addAttachmentOption((o) =>
      o.setName('documento').setDescription('INE o documento probatorio de identidad').setRequired(true)
    ),

  async execute(interaction) {
    const nombresIC = interaction.options.getString('nombres_ic');
    const apellidosIC = interaction.options.getString('apellidos_ic');
    const loanId = interaction.options.getString('id_publicacion').replace(/\D/g, '');
    const motivo = interaction.options.getString('motivo');
    const documento = interaction.options.getAttachment('documento');

    const loans = loadJSON('loans.json', {});
    const loan = loans[loanId];

    if (!loan) {
      return interaction.reply({
        content: '❌ No se encontró ningún préstamo con ese ID.',
        ephemeral: true,
      });
    }
    if (
      loan.nombresIC.toLowerCase() !== nombresIC.toLowerCase() ||
      loan.apellidosIC.toLowerCase() !== apellidosIC.toLowerCase()
    ) {
      return interaction.reply({
        content: '❌ El nombre/apellidos no coinciden con los registrados en este préstamo.',
        ephemeral: true,
      });
    }

    loan.activo = false;
    loan.removidoPorId = interaction.user.id;
    loan.motivoRemocion = motivo;
    loan.fechaRemocion = new Date().toISOString();
    saveJSON('loans.json', loans);

    await interaction.reply({
      content: `✅ Préstamo **ID ${loanId}** removido (motivo: ${motivo}).`,
      ephemeral: true,
    });

    const thread = await interaction.client.channels.fetch(loan.threadId).catch(() => null);
    if (thread) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('❌ PRÉSTAMO REMOVIDO / CERRADO')
        .addFields(
          { name: 'Motivo', value: motivo, inline: true },
          { name: 'Removido por', value: `${interaction.user}`, inline: true },
          {
            name: 'Saldo al cierre',
            value: `$${Number(loan.montoAdeudado).toLocaleString('es-MX')}`,
            inline: true,
          }
        )
        .setImage(documento.url)
        .setTimestamp();
      thread.send({ embeds: [embed] }).catch(() => {});
      thread.setArchived(true).catch(() => {});
    }
  },
};
