require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Carregar comandos
client.comandos = new Collection();
const comandoFiles = fs.readdirSync('./comandos').filter(f => f.endsWith('.js'));
for (const file of comandoFiles) {
  const comando = require(`./comandos/${file}`);
  client.comandos.set(comando.nome, comando);
}

// Evento de mensagem
client.on('messageCreate', async message => {
  if (!message.content.startsWith('.') || message.author.bot) return;

  const args = message.content.slice(1).split(/ +/);
  const comandoNome = args.shift().toLowerCase();

  const comando = client.comandos.get(comandoNome);
  if (!comando) return;

  try {
    await comando.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply('❌ Erro ao executar o comando!');
  }
});

// Bot online
client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

client.login(process.env.TOKEN);
