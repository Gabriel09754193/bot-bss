const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const fs = require('fs');

// ------------------------------
// CARREGAR COMANDOS
// ------------------------------
const comandosFiles = fs.readdirSync('./comandos').filter(f => f.endsWith('.js'));

for (const file of comandosFiles) {
  const comando = require(`./comandos/${file}`);
  client.commands.set(comando.nome, comando);
}

// ------------------------------
// EXECUTAR COMANDOS
// ------------------------------
client.on('messageCreate', async message => {
  if (!message.content.startsWith('.') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const comando = client.commands.get(cmdName);
  if (!comando) return;

  try {
    await comando.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply('❌ Erro ao executar o comando!');
  }
});

// ------------------------------
client.login(process.env.TOKEN);
