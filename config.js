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
