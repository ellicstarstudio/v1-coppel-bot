const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJSON, saveJSON } = require('../storage');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prestamo-pagar')
    .setDescription('Registra un pago sobre un préstamo Coppel.')
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
    .addNumberOption((o) =>
      o.setName('monto_pagado').setDescription('Monto pagado').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('concepto').setDescription('Concepto del pago').setRequired(true)
    ),

  async execute(interaction) {
    const nombresIC = interaction.options.getString('nombres_ic');
    const apellidosIC = interaction.options.getString('apellidos_ic');
    const loanId = interaction.options.getString('id_publicacion').replace(/\D/g, '');
    const montoPagado = interaction.options.getNumber('monto_pagado');
    const concepto = interaction.options.getString('concepto');

    const loans = loadJSON('loans.json', {});
    const loan = loans[loanId];

    if (!loan || !loan.activo) {
      return interaction.reply({
        content: '❌ No se encontró un préstamo activo con ese ID.',
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

    loan.montoAdeudado = Math.max(0, Number(loan.montoAdeudado) - montoPagado);
    const liquidado = loan.montoAdeudado === 0;
    if (liquidado) loan.activo = false;
    saveJSON('loans.json', loans);

    await interaction.reply({
      content: `✅ Pago registrado. Saldo restante: $${loan.montoAdeudado.toLocaleString('es-MX')}${
        liquidado ? ' — préstamo liquidado 🎉' : ''
      }`,
      ephemeral: true,
    });

    const thread = await interaction.client.channels.fetch(loan.threadId).catch(() => null);
    if (thread) {
      const embed = new EmbedBuilder()
        .setColor(liquidado ? config.colors.success : config.colors.primary)
        .setTitle(liquidado ? '✅ PRÉSTAMO LIQUIDADO' : '💵 Pago registrado')
        .addFields(
          { name: 'Monto pagado', value: `$${montoPagado.toLocaleString('es-MX')}`, inline: true },
          { name: 'Concepto', value: concepto, inline: true },
          { name: 'Saldo restante', value: `$${loan.montoAdeudado.toLocaleString('es-MX')}`, inline: true },
          { name: 'Registrado por', value: `${interaction.user}`, inline: true }
        )
        .setTimestamp();
      thread.send({ embeds: [embed] }).catch(() => {});
      if (liquidado) thread.setArchived(true).catch(() => {});
    }
  },
};
