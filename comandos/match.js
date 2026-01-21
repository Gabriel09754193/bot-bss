const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = {
  name: 'match',

  async execute(message) {
    const modal = new ModalBuilder()
      .setCustomId('modal_match')
      .setTitle('Abrir Match');

    const time = new TextInputBuilder()
      .setCustomId('time')
      .setLabel('Nome do seu time')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const formato = new TextInputBuilder()
      .setCustomId('formato')
      .setLabel('Formato (MD1 ou MD3)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(time),
      new ActionRowBuilder().addComponents(formato)
    );

    await message.showModal(modal);
  }
};
