const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('clientReady', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

/* ================= PENDÊNCIA ================= */

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(1).split(' ');
  const cmd = args.shift().toLowerCase();

  // !pendencia
  if (cmd === 'pendencia') {
    if (message.channel.id !== config.canalPendencias) return;

    const botao = new ButtonBuilder()
      .setCustomId('aceitar_pendencia')
      .setLabel('Aceitar jogo')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(botao);

    await message.channel.send({
      content: `📌 **IGL ${message.author} aguardando jogo**`,
      components: [row]
    });
  }

  // !resultado
  if (cmd === 'resultado') {
    const texto = args.join(' ');
    if (!texto) return message.reply('Use: !resultado <descrição>');

    const canal = message.guild.channels.cache.get(config.canalResultados);
    if (!canal) return;

    await canal.send({
      content: `🏆 **Resultado da partida**\n${texto}`
    });

    await message.channel.send('✅ Resultado enviado. Sala pode ser fechada.');
  }
});

/* ================= BOTÃO ================= */

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === 'aceitar_pendencia') {
      const modal = new ModalBuilder()
        .setCustomId('modal_time')
        .setTitle('Aceitar Partida');

      const input = new TextInputBuilder()
        .setCustomId('nome_time')
        .setLabel('Nome do seu time')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      await interaction.showModal(modal);
    }
  }

  /* ================= MODAL ================= */

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_time') {
      const nomeTime = interaction.fields.getTextInputValue('nome_time');

      const guild = interaction.guild;

      const canal = await guild.channels.create({
        name: `partida-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: config.categoriaPartidas,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      });

      await canal.send(
        `🎮 **Sala criada!**\n` +
        `Time: **${nomeTime}**\n` +
        `Use **!resultado** após o jogo.`
      );

      await interaction.reply({
        content: '✅ Sala criada com sucesso!',
        ephemeral: true
      });
    }
  }
});

client.login(config.token);
