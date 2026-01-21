const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./comandos').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.nome, command);
}

// Listener para mensagens
client.on('messageCreate', async message => {
  if (!message.content.startsWith('.')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply('❌ Erro ao executar o comando!');
  }
});

// Listener para modais
client.on('interactionCreate', async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith('resultadoModal-')) return;

  const partidaID = interaction.customId.split('-')[1];
  let partida;
  client.commands.get('match').partidasPendentes.forEach(p => {
    if (p.id.toString() === partidaID) partida = p;
  });

  if (!partida) return interaction.reply({ content: '❌ Partida não encontrada.', ephemeral: true });

  const vencedor = interaction.fields.getTextInputValue('vencedor');
  const placar = interaction.fields.getTextInputValue('placar');

  const canalResultadosID = 'ID_CANAL_RESULTADOS';
  const canalResultados = await interaction.guild.channels.fetch(canalResultadosID);

  const embedResultado = new EmbedBuilder()
    .setTitle('🏆 Resultado da Partida')
    .setColor('Green')
    .addFields(
      { name: 'Time Vencedor', value: vencedor, inline: true },
      { name: 'Placar / Mapas', value: placar, inline: true }
    )
    .setFooter({ text: `Registrado pelo Admin ${interaction.user.tag}` });

  await canalResultados.send({ embeds: [embedResultado] });
  await interaction.reply({ content: '✅ Resultado registrado com sucesso!', ephemeral: true });

  client.commands.get('match').partidasPendentes.delete(partida.criador);
});

client.login(process.env.TOKEN);
