const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔹 coleção de comandos
client.commands = new Collection();
const PREFIX = '.';

// 🔹 carregar comandos da pasta /comandos
const commandFiles = fs
  .readdirSync('./comandos')
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.name, command);
  console.log(`✅ Comando carregado: ${command.name}`);
}

// 🔹 escutar mensagens
client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply('❌ Erro ao executar o comando.');
  }
});

// 🔹 quando ligar
client.once('clientReady', () => {
  console.log('🤖 Bot online e pronto!');
});

client.login(process.env.TOKEN);
