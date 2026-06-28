const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { loadJSON, saveJSON } = require('../storage');
const config = require('../config');

function generateLoanId(existingIds) {
  let id;
  do {
    id = String(Math.floor(Math.random() * 99999999) + 1);
  } while (existingIds.includes(id));
  return id;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prestamo-otorgar')
    .setDescription('Otorga un préstamo Coppel y crea la publicación en el foro de préstamos.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((o) =>
      o.setName('usuario').setDescription('Usuario de Discord del cliente').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('nombres_ic').setDescription('Nombres IC del cliente').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('apellidos_ic').setDescription('Apellidos IC del cliente').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('edad').setDescription('Edad IC del cliente').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('direccion').setDescription('Dirección (escribe N/A si no aplica)').setRequired(true)
    )
    .addNumberOption((o) =>
      o.setName('monto_solicitado').setDescription('Monto solicitado').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('plazo').setDescription('Plazo a pagar (máx. 2 semanas IRL)').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('es_cliente')
        .setDescription('¿Es cliente?')
        .setRequired(true)
        .addChoices({ name: 'Sí', value: 'Sí' }, { name: 'No', value: 'No' })
    )
    .addStringOption((o) =>
      o.setName('referencia_1').setDescription('Referencia 1 (escribe N/A si no aplica)').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('referencia_2').setDescription('Referencia 2 (escribe N/A si no aplica)').setRequired(true)
    )
    .addAttachmentOption((o) =>
      o.setName('ine_vigente').setDescription('Imagen de INE vigente').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('identificador_credito').setDescription('Identificador de crédito del cliente').setRequired(true)
    )
    .addAttachmentOption((o) =>
      o.setName('foto_rostro').setDescription('Foto de licencia/rostro (ERLC)').setRequired(true)
    )
    .addUserOption((o) =>
      o.setName('gerente').setDescription('Gerente/RH que aprueba').setRequired(true)
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario');
    const nombresIC = interaction.options.getString('nombres_ic');
    const apellidosIC = interaction.options.getString('apellidos_ic');
    const edad = interaction.options.getInteger('edad');
    const direccion = interaction.options.getString('direccion');
    const monto = interaction.options.getNumber('monto_solicitado');
    const plazo = interaction.options.getString('plazo');
    const esCliente = interaction.options.getString('es_cliente');
    const referencia1 = interaction.options.getString('referencia_1');
    const referencia2 = interaction.options.getString('referencia_2');
    const ine = interaction.options.getAttachment('ine_vigente');
    const identificadorCredito = interaction.options.getString('identificador_credito');
    const foto = interaction.options.getAttachment('foto_rostro');
    const gerente = interaction.options.getUser('gerente');
    const cajero = interaction.user;

    const forumChannel = await interaction.client.channels.fetch(config.loansForumId).catch(() => null);
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      return interaction.reply({
        content: '❌ No se pudo encontrar el foro de préstamos. Revisa que el ID en config.js sea un canal de tipo Foro.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const loans = loadJSON('loans.json', {});
    const loanId = generateLoanId(Object.keys(loans));

    const now = new Date();
    const fecha = now.toLocaleDateString('es-MX');
    const hora = now.toLocaleTimeString('es-MX');

    const content =
      `# Prestamo Coppel\n` +
      `**__DATOS PERSONALES__**\n` +
      `Nombre de Discord: ${usuario}\n` +
      `Nombres IC: ${nombresIC}\n` +
      `Apellidos IC: ${apellidosIC}\n` +
      `Edad: ${edad}\n` +
      `Direccion: ${direccion}\n` +
      `**__DATOS DEL PRESTAMO__**\n` +
      `Monto Solicitado: $${monto.toLocaleString('es-MX')}\n` +
      `Plazo a Pagar: ${plazo}\n` +
      `Es cliente?: ${esCliente}\n` +
      `**__REFERENCIAS__**\n` +
      `Referencia 1: ${referencia1}\n` +
      `Referencia 2: ${referencia2}\n` +
      `**__DOCUMENTACION OFICIAL DEL CLIENTE__**\n` +
      `> > INE VIGENTE: ${ine.url}\n` +
      `> > IDENTIFICADOR DE CREDITO: ${identificadorCredito}\n` +
      `> > FOTO DE SU LICENCIA/ROSTRO (ERLC): ${foto.url}\n` +
      `**__AUTORIZACION AREA DE CREDITO__**\n` +
      `Cajero Que Otorga: ${cajero}\n` +
      `Gerente/RH Que Aprueba: ${gerente}\n` +
      `Firma del Cliente: \n\n` +
      `A partir de este momento yo ${nombresIC} ${apellidosIC} me comprometo a realizar mis pagos en tiempo y forma como se estipula en el contrato de préstamo y a que si llego a fallar en 5 o más pagos se me procederá con embargos, transferencia de deuda a despacho de cobranza y/o abogado y se presentará una demanda formal por dicha cosa.\n\n` +
      `Coppel a ${fecha} ${hora}\n` +
      `${config.loanSignatureImageUrl}`;

    let thread;
    try {
      thread = await forumChannel.threads.create({
        name: `PRESTAMO - ID ${loanId}`,
        message: { content },
      });
    } catch (err) {
      console.error(err);
      return interaction.editReply({
        content:
          '❌ No pude crear la publicación en el foro. Revisa que el bot tenga el permiso "Crear publicaciones" en ese canal.',
      });
    }

    loans[loanId] = {
      threadId: thread.id,
      usuarioId: usuario.id,
      nombresIC,
      apellidosIC,
      edad,
      direccion,
      montoSolicitado: monto,
      montoAdeudado: monto,
      plazo,
      esCliente,
      referencia1,
      referencia2,
      identificadorCredito,
      cajeroId: cajero.id,
      gerenteId: gerente.id,
      activo: true,
      fecha: now.toISOString(),
    };
    saveJSON('loans.json', loans);

    await interaction.editReply({ content: `✅ Préstamo creado: ${thread}` });
  },
};
