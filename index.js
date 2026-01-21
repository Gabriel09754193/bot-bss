const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== carregar comandos =====
client.commands = new Map();
const commandFiles = fs.readdirSync('./comandos').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.name, command);
}

// ===== carregar eventos =====
const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  client.on('interactionCreate', event.bind(null, client));
}

// ===== comandos por mensagem =====
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('.')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply('❌ Erro ao executar o comando.');
  }
});

client.once('ready', () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);
});

client.login(process.env.TOKEN);
