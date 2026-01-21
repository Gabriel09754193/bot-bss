const fs = require('fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'inscricao',

  async execute(message) {
    const botao = new ButtonBuilder()
      .setCustomId('abrir_modal_inscricao')
      .setLabel('📝 Inscrever time')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(botao);

    await message.reply({
      content: '📋 Clique no botão para inscrever seu time',
      components: [row]
    });

    // apaga a mensagem do comando
    await message.delete().catch(() => {});
  }
};

// ================== INTERAÇÃO DE MODAL ==================
// No seu interactionCreate.js, vamos atualizar a parte do modal_inscricao:

// Dentro do if(interaction.isModalSubmit() && interaction.customId === 'modal_inscricao')

if (interaction.isModalSubmit() && interaction.customId === 'modal_inscricao') {
  const nomeTime = interaction.fields.getTextInputValue('nome_time');
  const jogadores = interaction.fields.getTextInputValue('jogadores');

  const arquivo = './data/times.json';
  let times = [];

  // Lê arquivo JSON
  if (fs.existsSync(arquivo)) {
    times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
  }

  // Verifica se IGL já registrou algum time
  if (times.some(t => t.igl === interaction.user.id)) {
    return interaction.reply({
      content: '❌ Você já possui um time registrado!',
      ephemeral: true
    });
  }

  // Verifica se o nome do time já existe
  if (times.some(t => t.nome.toLowerCase() === nomeTime.toLowerCase())) {
    return interaction.reply({
      content: '❌ Esse nome de time já está registrado!',
      ephemeral: true
    });
  }

  // Adiciona o novo time
  times.push({
    nome: nomeTime,
    igl: interaction.user.id,
    jogadores: jogadores.split('\n'),
    inscritoEm: new Date().toISOString()
  });

  // Salva de volta
  fs.writeFileSync(arquivo, JSON.stringify(times, null, 2));

  await interaction.reply({
    content:
`✅ **TIME INSCRITO COM SUCESSO**

🏷️ Time: ${nomeTime}
👤 IGL: <@${interaction.user.id}>
🎮 Jogadores:
${jogadores}`
  });
}
