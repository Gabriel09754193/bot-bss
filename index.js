const fs = require('fs');
const { Client, Collection, GatewayIntentBits, InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

// Carrega comandos
const commandFiles = fs.readdirSync('./comandos').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(`./comandos/${file}`);
  client.commands.set(cmd.data.name, cmd);
}

// Evento ready
client.once('ready', async () => {
  console.log(`Bot online: ${client.user.tag}`);
});

// Slash commands
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Erro ao executar o comando!', ephemeral: true });
    }
  }

  // Modal submit
  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'inscricaoModal') {
      const nomeTime = interaction.fields.getTextInputValue('nomeTime');
      const jogadores = interaction.fields.getTextInputValue('jogadores').split(',').map(j => j.trim());
      const igl = interaction.user.id;

      const arquivo = './data/times.json';
      let times = [];
      if (fs.existsSync(arquivo)) times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));

      if (times.find(t => t.nome.toLowerCase() === nomeTime.toLowerCase())) {
        await interaction.reply({ content: '❌ Esse time já está cadastrado!', ephemeral: true });
        return;
      }

      // Mensagem de confirmação com botões
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirmarTime')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancelarTime')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      await interaction.reply({
        content: `Você deseja registrar o time **${nomeTime}** com os jogadores: ${jogadores.join(', ')}?`,
        components: [row],
        ephemeral: true
      });

      // Aguardar interação do botão
      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async i => {
        if (i.customId === 'confirmarTime') {
          times.push({ nome: nomeTime, igl, jogadores });
          fs.writeFileSync(arquivo, JSON.stringify(times, null, 2));
          await i.update({ content: `✅ Time **${nomeTime}** cadastrado com sucesso!`, components: [] });
        } else if (i.customId === 'cancelarTime') {
          await i.update({ content: '❌ Cadastro cancelado!', components: [] });
        }
      });
    }
  }
});

// Login
client.login(process.env.TOKEN);
