const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// Criar o client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Criar coleção de comandos
client.commands = new Collection();

// Carregar arquivos de comandos
const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.nome, command);
  console.log(`✅ Comando carregado: ${command.nome}`);
}

// Evento de mensagens
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const prefix = '.'; // Defina o seu prefixo
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName);
  if (!command) return;

  try {
    // Passa o client para os comandos
    await command.execute(message, args, client);
  } catch (err) {
    console.error('Erro ao executar comando:', err);
    message.reply('❌ Ocorreu um erro ao executar o comando!');
  }
});

// Evento ready
client.once('ready', () => {
  console.log(`🤖 Bot iniciado como ${client.user.tag}`);
});

// Login do bot
client.login(process.env.TOKEN);
