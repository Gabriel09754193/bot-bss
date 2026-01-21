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

    const aceitar = new ButtonBuilder()
      .setCustomId(`aceitar_match_${interaction.user.id}`)
      .setLabel('🎮 Aceitar partida')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(aceitar);

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
  if (interaction.isButton() && interaction.customId.startsWith('aceitar_match_')) {
    const iglCriador = interaction.customId.split('_')[2];

    // ❌ impedir aceitar o próprio match
    if (interaction.user.id === iglCriador) {
      return interaction.reply({
        content: '❌ Você não pode aceitar o seu próprio match.',
        ephemeral: true
      });
    }

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
          id: iglCriador,
          allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    // botões dentro do chat
    const fechar = new ButtonBuilder()
      .setCustomId('fechar_match')
      .setLabel('🔒 Fechar chat')
      .setStyle(ButtonStyle.Danger);

    const resultado = new ButtonBuilder()
      .setCustomId('resultado_match')
      .setLabel('📊 Resultado do jogo')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(resultado, fechar);

    await canal.send({
      content:
`🎮 **PARTIDA CRIADA**
IGLs:
- <@${iglCriador}>
- <@${interaction.user.id}>

Usem este chat para marcar o jogo.`,
      components: [row]
    });

    await interaction.reply({
      content: `✅ Chat da partida criado: ${canal}`,
      ephemeral: true
    });
  }

  // ===== BOTÃO RESULTADO =====
  if (interaction.isButton() && interaction.customId === 'resultado_match') {
    const modal = new ModalBuilder()
      .setCustomId('modal_resultado')
      .setTitle('Resultado da Partida');

    const resultado = new TextInputBuilder()
      .setCustomId('resultado')
      .setLabel('Ex: Vitória da Team X por 2x0')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(resultado)
    );

    return interaction.showModal(modal);
  }

  // ===== MODAL RESULTADO =====
  if (interaction.isModalSubmit() && interaction.customId === 'modal_resultado') {
    const resultado = interaction.fields.getTextInputValue('resultado');

    await interaction.reply({
      content: `📊 **RESULTADO REGISTRADO**\n${resultado}`
    });
  }

  // ===== FECHAR MATCH (ADM) =====
  if (interaction.isButton() && interaction.customId === 'fechar_match') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Apenas administradores podem fechar o chat.',
        ephemeral: true
      });
    }

    await interaction.channel.send('🔒 **Chat encerrado por um administrador.**');
    setTimeout(() => interaction.channel.delete(), 3000);
  }
};
