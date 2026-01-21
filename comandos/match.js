const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'match',

  async execute(message) {
    const botao = new ButtonBuilder()
      .setCustomId('abrir_modal_match')
      .setLabel('➕ Criar Match')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(botao);

    await message.reply({
      content: '🎮 Clique no botão para abrir um match',
      components: [row]
    });

    // apaga a mensagem ".match"
    await message.delete().catch(() => {});
  }
};
