const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} = require('discord.js');

module.exports = {
  nome: 'match',
  descricao: 'Criar uma partida',
  partidasPendentes: new Map(),

  async execute(message, args) {

    const IGL_ROLE_ID = '1463258074310508765';
    const canalSolicitacoesID = '1463270089376927845';
    const categoriaPartidasID = '1463562210591637605';
    const canalResultadosID = '1463260797604987014';

    // Verificar se usuário é IGL
    if (!message.member.roles.cache.has(IGL_ROLE_ID)) {
      return message.reply('❌ Apenas IGLs podem usar este comando.');
    }

    // Verificar se já possui partida pendente
    if (this.partidasPendentes.has(message.author.id)) {
      return message.reply('❌ Você já possui uma partida pendente.');
    }

    try {
      const filter = m => m.author.id === message.author.id;

      // Pergunta 1: Nome do time
      const msgTime = await message.channel.send('🎯 **Digite o nome do seu time:**');
      const nomeTimeMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return message.channel.send('❌ Tempo esgotado.');
      await nomeTimeMsg.delete();
      await msgTime.delete();

      // Pergunta 2: Formato MD1 / MD3
      const msgFormato = await message.channel.send('⚔️ **Escolha o formato da partida:** `MD1` ou `MD3`');
      const formatoMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!formatoMsg) return message.channel.send('❌ Tempo esgotado.');
      const formato = formatoMsg.content.toUpperCase() === 'MD3' ? 'MD3' : 'MD1';
      await formatoMsg.delete();
      await msgFormato.delete();

      // Criar partida pendente
      const partida = {
        id: Date.now(),
        criador: message.author.id,
        nomeTime: nomeTimeMsg.content,
        formato,
        status: 'aguardando'
      };
      this.partidasPendentes.set(message.author.id, partida);

      // Mensagem no canal de solicitações
      const canalSolicitacoes = await message.guild.channels.fetch(canalSolicitacoesID);
      const embed = new EmbedBuilder()
        .setTitle('🎮 Partida Solicitada')
        .setColor('Blurple')
        .addFields(
          { name: 'Time', value: partida.nomeTime, inline: true },
          { name: 'IGL', value: `<@${message.author.id}>`, inline: true },
          { name: 'Formato', value: partida.formato, inline: true }
        )
        .setDescription('⏳ Aguardando outro IGL aceitar a partida!')
        .setFooter({ text: '⚠️ Apenas admins podem cancelar ou registrar o resultado.' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('aceitarPartida')
            .setLabel('✅ Aceitar')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('cancelarPartida')
            .setLabel('❌ Cancelar (Admins)')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('resultadoPartida')
            .setLabel('🏆 Resultado (Admins)')
            .setStyle(ButtonStyle.Primary)
        );

      const msgSolicitacao = await canalSolicitacoes.send({ embeds: [embed], components: [row] });
      await message.channel.send(`✅ Solicitação enviada para ${canalSolicitacoes}`);

      // Collector de interações
      const collector = msgSolicitacao.createMessageComponentCollector({ time: 86400000 });

      collector.on('collect', async i => {

        // Cancelar partida - admins
        if (i.customId === 'cancelarPartida') {
          if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return i.reply({ content: '❌ Apenas admins podem cancelar esta partida.', ephemeral: true });
          }
          await i.update({ content: `❌ Partida de **${partida.nomeTime}** cancelada pelo admin <@${i.user.id}>.`, embeds: [], components: [] });
          this.partidasPendentes.delete(partida.criador);
        }

        // Registrar resultado - admins
        if (i.customId === 'resultadoPartida') {
          if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return i.reply({ content: '❌ Apenas admins podem registrar o resultado.', ephemeral: true });
          }

          const modal = new ModalBuilder()
            .setCustomId(`resultadoModal-${partida.id}`)
            .setTitle('Registrar Resultado da Partida');

          const vencedorInput = new TextInputBuilder()
            .setCustomId('vencedor')
            .setLabel('Time vencedor')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const placarInput = new TextInputBuilder()
            .setCustomId('placar')
            .setLabel('Placar e mapas (ex: 2x0 Train/Mirage)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          const row1 = new ActionRowBuilder().addComponents(vencedorInput);
          const row2 = new ActionRowBuilder().addComponents(placarInput);

          modal.addComponents(row1, row2);
          await i.showModal(modal);
        }

        // Aceitar partida
        if (i.customId === 'aceitarPartida') {
          if (i.user.id === partida.criador) return i.reply({ content: '❌ Você não pode aceitar sua própria partida.', ephemeral: true });

          const categoria = await message.guild.channels.fetch(categoriaPartidasID);
          const canalPrivado = await message.guild.channels.create({
            name: `match-${partida.nomeTime}`,
            type: ChannelType.GuildText,
            parent: categoria.id,
            permissionOverwrites: [
              { id: message.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
              { id: partida.criador, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
              { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
          });

          await i.update({ content: `✅ Partida aceita! Canal privado criado: ${canalPrivado}`, components: [], embeds: [] });
        }

      });

    } catch (err) {
      console.error('Erro ao criar partida:', err);
      message.channel.send('❌ Ocorreu um erro ao criar a partida.');
    }
  }
};
