const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

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

    // apaga a mensagem ".inscricao"
    await message.delete().catch(() => {});
  }
};
