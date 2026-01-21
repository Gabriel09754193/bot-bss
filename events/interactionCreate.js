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

  // ===== ABRIR MODAL =====
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

  // ===== MODAL SUBMIT =====
  if (interaction.isModalSubmit() && interaction.customId === 'modal_match') {
    const time = interaction.fields.getTextInputValue('time');
    const formato = interaction.fields.getTextInputValue('formato');

    const botao = new ButtonBuilder()
      .setCustomId('aceitar_match')
      .setLabel('🎮 Aceitar partida')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(botao);

    await interaction.reply({
      content:
`📢 **MATCH ABERTO**
👤 IGL: <@${interaction.user.id}>
🏷️ Time: **${time}**
🎯 Formato: **${formato}**

Outro IGL pode aceitar abaixo 👇`,
      components: [row]
    });
  }

  // ===== ACEITAR MATCH =====
  if (interaction.isButton() && interaction.customId === 'aceitar_match') {
    const guild = interaction.guild;

    const canal = await guild.channels.create({
      name: `match-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    await canal.send(
`🎮 **PARTIDA CRIADA**
IGL que aceitou: <@${interaction.user.id}>

Use este chat para marcar o jogo.`
    );

    await interaction.reply({
      content: `✅ Chat criado: ${canal}`,
      ephemeral: true
    });
  }
};
