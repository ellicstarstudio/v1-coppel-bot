# V1 | COPPEL — Bot de Discord

Bot con sistema de tickets de soporte y sistema de créditos Coppel, hecho con **discord.js v14**.

## 📦 Instalación

1. Instala Node.js 18 o superior.
2. Abre una terminal dentro de esta carpeta y corre:
   ```
   npm install
   ```
3. Copia `.env.example` a un archivo nuevo llamado `.env` y rellena:
   - `DISCORD_TOKEN`: el token de tu bot (Discord Developer Portal → Bot → Reset Token).
   - `CLIENT_ID`: el "Application ID" de tu bot (Developer Portal → General Information).
   - `GUILD_ID`: el ID de tu servidor de Discord (clic derecho al servidor → Copiar ID, con el modo desarrollador activado).

4. **Importante — Intents privilegiados:** en el Developer Portal, ve a tu app → **Bot** → activa **SERVER MEMBERS INTENT**.

5. **Invita al bot a tu servidor** con estos permisos mínimos: Gestionar Canales, Gestionar Roles (solo si quieres restringir comandos por permiso), Enviar Mensajes, Insertar Enlaces, Adjuntar Archivos, Usar Comandos de Aplicación, Leer Historial de Mensajes.

6. Registra los comandos slash (solo necesitas hacer esto una vez, o cada vez que agregues/edites un comando):
   ```
   npm run deploy
   ```

7. Inicia el bot:
   ```
   npm start
   ```

## ⚙️ Configuración

Todos los IDs (canal del panel, canal de logs, rol de staff, categorías de tickets) están en **`config.js`**. Si algún ID cambia en tu servidor, edítalo ahí — no necesitas tocar el resto del código.

⚠️ **Sobre la imagen de "ticket movido"**: la URL que me diste es un link firmado de Discord CDN (tiene parámetros `?ex=...&is=...&hm=...`) que **caduca** después de un tiempo. Cuando deje de cargar, solo reemplaza `movedImageUrl` en `config.js` con un link nuevo (puedes volver a subir la imagen a cualquier canal y copiar el enlace, o usar un host permanente como Imgur).

## 🗂️ Comandos incluidos

| Comando | Descripción |
|---|---|
| `/panel-soporte` | Envía el panel de tickets al canal configurado |
| `/panel-estatus` | Envía el panel de estatus del soporte (Abierto/Cerrado/Mantenimiento) |
| `/perfil-revisar usuario:` | Muestra el perfil de crédito y deuda de préstamos de un usuario (solo lo ve quien ejecuta) |
| `/credito-otorgar` | Otorga un crédito Coppel (nombre IC, usuario, roblox, edad, identificador, límite) |
| `/credito-remover` | Remueve un crédito Coppel existente (con motivo) |
| `/prestamo-otorgar` | Otorga un préstamo y crea la publicación en el foro de préstamos |
| `/prestamo-pagar` | Registra un pago sobre un préstamo y actualiza su saldo |
| `/prestamo-remover` | Cierra/remueve un préstamo (PAGO/ERROR/CANCELADO) |
| `/embed` | Envía un embed personalizado a cualquier canal (comando genérico de staff — ver nota abajo) |

> **Nota sobre `/embed`:** en tu mensaje original no especificaste los parámetros de este comando, así que lo armé como un creador de embeds genérico para staff (canal, título, descripción, color, imagen, thumbnail, footer). Si lo querías para algo más específico (por ejemplo un embed con plantilla fija), dime y lo ajusto.

## 🎫 Cómo funciona el sistema de tickets

1. Un usuario corre `/panel-soporte` (staff) → se manda el panel con el menú desplegable al canal fijo.
2. Cualquier usuario elige una categoría en el menú → se crea un canal privado dentro de la categoría de Discord correspondiente, con ping al usuario y al rol de staff.
3. Dentro del ticket hay:
   - ❌ **Cerrar ticket** (solo staff): manda log al canal de logs, DM de cierre al usuario, y borra el canal a los 5 segundos.
   - 🗝️ **Reclamar ticket** (solo staff, una sola vez): manda mensaje verde de "Ticket Reclamado".
   - 📁 **Mover de categoría** (solo staff): cambia la categoría del canal, manda mensaje con categoría anterior/actual + imagen, y ping al rol de staff.
4. Un usuario solo puede tener **un ticket abierto a la vez**.

## 💳 Sistema de créditos

- `/credito-otorgar` guarda el crédito y evita que un mismo identificador (ej. `C-100000`) se use dos veces mientras esté activo.
- `/credito-remover` valida que el identificador coincida con el registrado antes de remover.
- Ambos mandan log al canal de logs y DM al usuario afectado.
- `/perfil-revisar` consulta esos datos guardados (persisten en `data/credits.json`, no se pierden al reiniciar el bot).

## 💾 Almacenamiento

Los datos (tickets abiertos, créditos y préstamos) se guardan en archivos JSON dentro de la carpeta `data/` — no necesitas instalar ninguna base de datos. Si más adelante quieres migrar a algo como SQLite o MongoDB porque el bot crece mucho, dime y lo adaptamos.

## 💰 Sistema de préstamos

- `/prestamo-otorgar` crea una publicación en el **foro** configurado (`loansForumId`) con el formato de contrato, genera un ID aleatorio de hasta 8 dígitos para el préstamo, y guarda el registro con el monto adeudado (que empieza igual al monto solicitado).
- `/prestamo-pagar` busca el préstamo por su ID, valida que el nombre/apellidos coincidan, resta el pago al saldo, y publica un mensaje de confirmación dentro del hilo del foro. Si el saldo llega a $0, marca el préstamo como liquidado y archiva el hilo automáticamente.
- `/prestamo-remover` cierra un préstamo (por pago, error o cancelación), adjunta el documento de identidad proporcionado, publica el motivo en el hilo, y lo archiva.
- `/perfil-revisar` ahora también suma la deuda activa de todos los préstamos del usuario y la muestra en el perfil.

⚠️ **Permiso necesario:** el bot necesita el permiso **"Crear publicaciones"** (Create Posts) en el canal del foro de préstamos para que `/prestamo-otorgar` funcione.

⚠️ **Sobre la imagen/firma del préstamo**: igual que la otra imagen, `loanSignatureImageUrl` en `config.js` es un link firmado de Discord que caduca — reemplázalo cuando deje de cargar.

> **Nota:** en tu mensaje original el cierre de la publicación tenía el formato `Coppel a [fecha] || url ||`. Los `||...||` en Discord crean un **spoiler** (oculta el contenido hasta hacer clic), así que asumí que no era intencional y dejé la imagen visible sin spoiler. Si sí la querías oculta como spoiler, dime y lo ajusto.

## 🚦 Panel de estatus de soporte

- `/panel-estatus` (staff) envía un panel con 3 botones: 🟢 Abierto, 🔴 Cerrado, 🟡 Mantenimiento.
- Al presionar un botón (solo staff), el bot:
  1. Guarda el nuevo estado.
  2. Renombra el canal de voz configurado (`statusVoiceChannelId`) según el estado.
  3. Manda un anuncio con `@everyone` al canal configurado (`statusAnnounceChannelId`).
  4. Actualiza el propio panel para mostrar el estado actual (deshabilita el botón del estado activo).
- Si el estado **no** es "Abierto", el menú de categorías del panel de tickets rechaza la apertura de nuevos tickets con un mensaje explicando el estatus actual.

⚠️ **Permisos necesarios:** el bot necesita **"Gestionar Canales"** (para renombrar el canal de voz) y **"Mencionar a @everyone"** en el canal de anuncios.
