const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

// Carrega comandos
const commandFiles = fs.readdirSync('./comandos').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(`./comandos/${file}`);
  client.commands.set(cmd.name, cmd);
}

// Evento de mensagens
client.on('messageCreate', async message => {
  if (!message.content.startsWith('.') || message.author.bot) return;
  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();

  if (!client.commands.has(command)) return;

  try {
    await client.commands.get(command).execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply('❌ Erro ao executar o comando!');
  }
});

// Evento ready
client.once('ready', async () => {
  console.log(`Bot online: ${client.user.tag}`);
  // Atualiza painel automaticamente ao iniciar
  const painel = require('./comandos/paineladmin');
  await painel.atualizarPainel(client);
});

client.login('SEU_TOKEN_AQUI');

