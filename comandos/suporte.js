const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  nome: 'suporte',
  descricao: 'Abrir um ticket de suporte',

  async execute(message, args, client) {
    // ================= CONFIG =================
    const CANAL_SUPORTE_ID = '1463261657798283351';
    const CARGO_ADMIN_ID = '1463257679115063370';
    const CATEGORIA_TICKETS_ID = '1463677292365611153';
    // ==========================================

    // Verifica se é no canal correto
    if (message.channel.id !== CANAL_SUPORTE_ID) {
      return message.reply('❌ Este comando só pode ser usado no canal de suporte.');
    }

    try {
      await message.delete();

      // Cria canal do ticket
      const canalTicket = await message.guild.channels.create({
        name: `🎫・ticket-${message.author.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORIA_TICKETS_ID,
        permissionOverwrites: [
          {
            id: message.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: message.author.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages
            ]
          },
          {
            id: CARGO_ADMIN_ID,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages
            ]
          }
        ]
      });

      // Embed inicial
      const embed = new EmbedBuilder()
        .setTitle('🎟️ Ticket de Suporte')
        .setColor('Blue')
        .setDescription(
          `Olá <@${message.author.id}> 👋\n\n` +
          `Explique seu problema ou dúvida com o máximo de detalhes possível.\n` +
          `Nossa equipe irá te atender em breve.`
        )
        .setFooter({ text: 'Equipe de Suporte' });

      // Botão de fechar
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('🔒 Fechar Ticket (Admins)')
          .setStyle(ButtonStyle.Danger)
      );

      const msgTicket = await canalTicket.send({
        content: `<@${message.author.id}> | <@&${CARGO_ADMIN_ID}>`,
        embeds: [embed],
        components: [row]
      });

      // Collector do botão
      const collector = msgTicket.createMessageComponentCollector();

      collector.on('collect', async interaction => {
        if (interaction.customId !== 'fechar_ticket') return;

        // Apenas admins
        if (!interaction.member.roles.cache.has(CARGO_ADMIN_ID)) {
          return interaction.reply({
            content: '❌ Apenas administradores podem fechar o ticket.',
            ephemeral: true
          });
        }

        await interaction.reply(
          `🔒 Ticket fechado por <@${interaction.user.id}>.\nO canal será deletado em **5 segundos**.`
        );

        setTimeout(() => {
          canalTicket.delete().catch(() => {});
        }, 5000);
      });

      // Confirmação no canal de suporte
      await message.channel.send(
        `✅ <@${message.author.id}>, seu ticket foi criado: ${canalTicket}`
      );

    } catch (err) {
      console.error('Erro ao criar ticket:', err);
      message.channel.send('❌ Ocorreu um erro ao criar o ticket.');
    }
  }
};
