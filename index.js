const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== CONFIGURAÇÃO (SÓ MUDAR ISSO) =====
const PREFIX = '.';
const CATEGORIA_PARTIDAS = '1463269500920266966';
const CANAL_RESULTADOS = 1463260797604987014';
// =======================================

client.once('clientReady', () => {
  console.log('BOT ONLINE');
});

// ===== COMANDOS =====
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const comando = args.shift().toLowerCase();

  // .pendencia
  if (comando === 'pendencia') {
    const botao = new ButtonBuilder()
      .setCustomId(`aceitar_${message.author.id}`)
      .setLabel('Aceitar jogo')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(botao);

    await message.channel.send({
      content: `📌 **IGL ${message.author.username} aguardando jogo**`,
      components: [row]
    });
  }

  // .resultado
  if (comando === 'resultado') {
    const texto = args.join(' ');
    if (!texto) {
      return message.reply('Use: `.resultado descrição do jogo`');
    }

    const canal = message.guild.channels.cache.get(CANAL_RESULTADOS);
    if (!canal) return message.reply('Canal de resultados não encontrado.');

    await canal.send(`🏆 **Resultado da partida:**\n${texto}`);
    await message.reply('✅ Resultado enviado!');
  }
});

// ===== BOTÃO =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const iglId = interaction.customId.split('_')[1];
  const guild = interaction.guild;

  const canal = await guild.channels.create({
    name: `partida-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: CATEGORIA_PARTIDAS,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: iglId,
        allow: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }
    ]
  });

  await canal.send(
    `🎮 **Sala criada!**\n` +
    `IGLs: <@${iglId}> x <@${interaction.user.id}>\n\n` +
    `Após o jogo use:\n` +
    `\`.resultado Vitória do time X por 2x0\``
  );

  await interaction.reply({
    content: '✅ Sala criada!',
    ephemeral: true
  });
});

client.login(process.env.DISCORD_TOKEN);

