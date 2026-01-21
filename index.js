const fs = require('fs');
const { Client, Collection, GatewayIntentBits, InteractionType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Coleção de comandos
client.commands = new Collection();

// Carrega todos os comandos da pasta ./comandos
const commandFiles = fs.readdirSync('./comandos').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(`./comandos/${file}`);
  client.commands.set(cmd.name, cmd);
}

// Evento mensagens
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
client.once('ready', () => {
  console.log(`Bot online: ${client.user.tag}`);
});

// Tratamento de modal submit (para inscrição)
client.on('interactionCreate', async interaction => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'inscricaoModal') {
    const nomeTime = interaction.fields.getTextInputValue('nomeTime');
    const jogadores = interaction.fields.getTextInputValue('jogadores').split(',').map(j => j.trim());
    const igl = interaction.user.id;

    const arquivo = './data/times.json';
    let times = [];
    if (fs.existsSync(arquivo)) times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));

    // Verifica se o time já existe
    if (times.find(t => t.nome.toLowerCase() === nomeTime.toLowerCase())) {
      await interaction.reply({ content: '❌ Esse time já está cadastrado!', ephemeral: true });
      return;
    }

    // Adiciona time
    times.push({ nome: nomeTime, igl, jogadores });
    fs.writeFileSync(arquivo, JSON.stringify(times, null, 2));

    await interaction.reply({ content: `✅ Time **${nomeTime}** cadastrado com sucesso!`, ephemeral: true });
  }
});

// Login via variável de ambiente TOKEN (Railway)
client.login(process.env.TOKEN);
