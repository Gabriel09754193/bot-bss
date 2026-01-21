const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

module.exports = async (client, interaction) => {

  // ================= MATCH =================

  if (interaction.isButton() && interaction.customId === 'abrir_modal_match') {
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

    return interaction.showModal(modal);
  }

  // ================= INSCRIÇÃO =================

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

  // ===== MODAL INSCRIÇÃO =====
  if (interaction.isModalSubmit() && interaction.customId === 'modal_inscricao') {
    const nomeTime = interaction.fields.getTextInputValue('nome_time');
    const jogadores = interaction.fields.getTextInputValue('jogadores');

    await interaction.reply({
      content:
`✅ **TIME INSCRITO COM SUCESSO**

🏷️ **Time:** ${nomeTime}
👤 **IGL:** <@${interaction.user.id}>
🎮 **Jogadores:**
${jogadores}`
    });
  }

};
