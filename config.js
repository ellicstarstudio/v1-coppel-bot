module.exports = {
  // Canal donde se enviará el panel de soporte (comando /panel-soporte)
  panelChannelId: '1520565387001856080',

  // Canal donde se mandan TODOS los logs (tickets cerrados, créditos otorgados/removidos)
  logsChannelId: '1520568852629426286',

  // Rol de Staff: único rol que puede reclamar/cerrar/mover tickets
  staffRoleId: '1520571384097538108',

  // Imagen que se muestra cuando se mueve un ticket de categoría
  // ⚠️ IMPORTANTE: la URL que diste es un link firmado de Discord (tiene ?ex=...&is=...&hm=...)
  // y CADUCA después de cierto tiempo. Te recomiendo subir la imagen a un canal y
  // copiar el link de "Copiar enlace" de nuevo cuando deje de funcionar, o usar un host
  // permanente (imgur, un CDN propio, etc).
  movedImageUrl:
    'https://cdn.discordapp.com/attachments/1520568852629426286/1520571748679155722/coppel-rediseno-de-logo-oficial-v0-9f82yfin6z5f1.webp',

  colors: {
    primary: 0x0047ab, // azul Coppel
    success: 0x57f287, // verde
    danger: 0xed4245, // rojo
  },

  // Foro donde se publica cada préstamo (comando /prestamo-otorgar)
  loansForumId: '1520526381774278718',

  // Imagen/firma que se pone al final de cada publicación de préstamo
  // ⚠️ Igual que la otra imagen, esta URL caduca con el tiempo (link firmado de Discord).
  // Reemplázala en config.js cuando deje de cargar.
  loanSignatureImageUrl:
    'https://cdn.discordapp.com/attachments/1520572942105444492/1520573033822158968/coppel-rediseno-de-logo-oficial-v0-9f82yfin6z5f1.webp',

  // Panel de estatus de soporte (comando /panel-estatus)
  statusPanelChannelId: '1520881575733231730', // canal donde vive el panel con los 3 botones
  statusAnnounceChannelId: '1520882284759351338', // canal donde se anuncia el cambio de estatus (@everyone)
  statusVoiceChannelId: '1520281487788867644', // canal de voz que cambia de nombre según el estatus

  // Textos y nombre de canal de voz para cada estatus de soporte
  supportStatus: {
    abierto: {
      label: 'Abierto',
      emoji: '🟢',
      vcName: '📲 | Atencion al cliente: 🟢',
      announce:
        '🟢 **¡El soporte ha sido reabierto!** Ya puedes abrir tickets nuevamente desde el panel de soporte.',
    },
    cerrado: {
      label: 'Cerrado',
      emoji: '🔴',
      vcName: '📲 | Atencion al cliente: 🔴',
      announce:
        '🔴 **El soporte se encuentra cerrado por el momento.** No será posible abrir tickets hasta que se reabra el servicio. Gracias por tu paciencia.',
    },
    mantenimiento: {
      label: 'Mantenimiento',
      emoji: '🟡',
      vcName: '📲 | Atencion al cliente: 🟡',
      announce:
        '🟡 **El soporte está en mantenimiento.** Estamos realizando ajustes; no se podrán abrir tickets de forma temporal.',
    },
  },

  // Categorías de ticket: key interna -> nombre visible, id de la categoría de Discord, emoji
  categories: {
    dudas: {
      name: 'Dudas o aclaraciones generales',
      categoryId: '1520566338454552648',
      emoji: '❓',
    },
    incidencias: {
      name: 'Reportes de incidencias',
      categoryId: '1520566302346051615',
      emoji: '⚠️',
    },
    cambios: {
      name: 'Cambios y devoluciones',
      categoryId: '1520566267671609457',
      emoji: '🔄',
    },
    pedidos: {
      name: 'Estado de Pedidos',
      categoryId: '1520566123014127717',
      emoji: '📦',
    },
    creditos: {
      name: 'Créditos Coppel',
      categoryId: '1520566064608444597',
      emoji: '💳',
    },
    compras: {
      name: 'Compras en tienda o en línea',
      categoryId: '1520566003736510567',
      emoji: '🛍️',
    },
  },
};
