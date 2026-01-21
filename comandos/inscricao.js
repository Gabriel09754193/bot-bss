const fs = require('fs');
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inscricao')
    .setDescription('Cadastro de time para a liga'),

  async execute(interaction) {
    // Criar modal
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

    // Mostrar modal
    await interaction.showModal(modal);
  }
};
