const fs = require('fs');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType } = require('discord.js');

module.exports = {
  name: 'inscricao',

  async execute(message, args, client) {
    // Criar modal
    const modal = new ModalBuilder()
      .setCustomId('inscricaoModal')
      .setTitle('Cadastro de Time');

    // Campo do nome do time
    const nomeTimeInput = new TextInputBuilder()
      .setCustomId('nomeTime')
      .setLabel('Nome do Time')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite o nome do seu time')
      .setRequired(true);

    // Campo dos jogadores
    const jogadoresInput = new TextInputBuilder()
      .setCustomId('jogadores')
      .setLabel('Jogadores (separe por vírgula)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Jogador1, Jogador2, Jogador3')
      .setRequired(true);

    // Adicionar campos em action rows
    const firstRow = new ActionRowBuilder().addComponents(nomeTimeInput);
    const secondRow = new ActionRowBuilder().addComponents(jogadoresInput);
    modal.addComponents(firstRow, secondRow);

    // Mostrar modal
    await message.showModal(modal);

    // Esperar resposta do modal
    const filter = i => i.customId === 'inscricaoModal' && i.user.id === message.author.id;

    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect
