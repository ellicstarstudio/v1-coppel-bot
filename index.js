require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const {
  handleCategorySelect,
  handleClaim,
  handleClose,
  handleMoveSelect,
} = require('./handlers/tickets');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'Revisando Creditos Coppel', type: ActivityType.Watching }],
    status: 'online',
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      return command.execute(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_select_category') return handleCategorySelect(interaction);
      if (interaction.customId === 'ticket_move_category') return handleMoveSelect(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'ticket_claim') return handleClaim(interaction);
      if (interaction.customId === 'ticket_close') return handleClose(interaction);
      return;
    }
  } catch (error) {
    console.error(error);
    const errorMsg = '❌ Ocurrió un error al procesar esta interacción.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
