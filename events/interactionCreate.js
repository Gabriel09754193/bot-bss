const fs = require('fs');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = async (client, interaction) => {

  // ================= MODAL DE INSCRIÇÃO =================
  if (interaction.isButton() && interaction.customId === 'abrir_modal_inscricao') {
    const modal = new ModalBuilder()
      .setCustomId('modal_inscricao')
      .setTitle('Inscrição de Time');

    const nomeTime = new TextInputBuilder()
      .setCustomId('nome_time')
      .setLabel('Nome do Time')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const jogadores = new TextInputBuilder()
      .setCustomId('jogadores')
      .setLabel('Jogadores (um por linha)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nomeTime),
      new ActionRowBuilder().addComponents(jogadores)
    );

    return interaction.showModal(modal);
  }

  // ================= SALVAR INSCRIÇÃO =================
  if (interaction.isModalSubmit() && interaction.customId === 'modal_inscricao') {
    const nomeTime = interaction.fields.getTextInputValue('nome_time');
    const jogadores = interaction.fields.getTextInputValue('jogadores');

    const arquivo = './data/times.json';
    let times = [];

    if (fs.existsSync(arquivo)) {
      times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
    }

    // Verifica duplicidade
    if (times.some(t => t.igl === interaction.user.id)) {
      return interaction.reply({
        content: '❌ Você já possui um time registrado!',
        ephemeral: true
      });
    }

    if (times.some(t => t.nome.toLowerCase() === nomeTime.toLowerCase())) {
      return interaction.reply({
        content: '❌ Esse nome de time já está registrado!',
        ephemeral: true
      });
    }

    // Adiciona o time
    times.push({
      nome: nomeTime,
      igl: interaction.user.id,
      jogadores: jogadores.split('\n'),
      inscritoEm: new Date().toISOString()
    });

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
};
