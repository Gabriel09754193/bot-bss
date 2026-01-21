const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

module.exports = async (client, interaction) => {

  // ===== MODAL =====
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_match') {
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

Clique no botão abaixo para aceitar.`,
        components: [row]
      });
    }
  }

  // ===== BOTÃO =====
  if (interaction.isButton()) {
    if (interaction.customId === 'aceitar_match') {
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
IGLs conectados:
- <@${interaction.user.id}>

Usem este chat para marcar o jogo.
Após finalizar, use:
\`.resultado TimeVencedor TimePerdedor\`
`
      );

      await interaction.reply({
        content: `✅ Chat da partida criado: ${canal}`,
        ephemeral: true
      });
    }
  }
};
