const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  name: 'inscricao',

  async execute(message, args) {
    const modal = new ModalBuilder()
      .setCustomId('inscricaoModal')
      .setTitle('Cadastro de Time');

    const nomeTimeInput = new TextInputBuilder()
      .setCustomId('nomeTime')
      .setLabel('Nome do Time')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite o nome do seu time')
      .setRequired(true);

    const jogadoresInput = new TextInputBuilder()
      .setCustomId('jogadores')
      .setLabel('Jogadores (separe por vírgula)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Jogador1, Jogador2, Jogador3')
      .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(nomeTimeInput);
    const secondRow = new ActionRowBuilder().addComponents(jogadoresInput);

    modal.addComponents(firstRow, secondRow);

    await message.showModal(modal);
  }
};
