const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const painel = require('./paineladmin');

module.exports = {
  name: 'inscricao',

  async execute(message, args, client) {
    const botao = new ButtonBuilder()
      .setCustomId('abrir_modal_inscricao')
      .setLabel('📝 Inscrever time')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(botao);

    await message.reply({ content: '📋 Clique no botão para inscrever seu time', components: [row] });
    await message.delete().catch(() => {});

    // Atualiza painel automaticamente
    await painel.atualizarPainel(client);
  }
};
