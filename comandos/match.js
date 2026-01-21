const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  nome: 'match',
  descricao: 'Criar uma partida',
  partidasPendentes: new Map(),

  async execute(message, args) {
    // ------------------------------
    // CONFIGURE AQUI OS IDS CORRETOS
    // ------------------------------
    const canalSolicitacoesID = '1463270089376927845'; // Canal público onde os IGLs verão as solicitações
    const categoriaPartidasID = '1463562210591637605'; // Categoria para canais privados das partidas
    const canalResultadosID = '1463260797604987014'; // Canal de resultados

    // ------------------------------
    // VERIFICAR SE O IGL JÁ TEM PARTIDA
    // ------------------------------
    if (this.partidasPendentes.has(message.author.id)) {
      return message.reply('❌ Você já possui uma partida pendente.');
    }

    try {
      // ------------------------------
      // PERGUNTA 1: Nome do time
      // ------------------------------
      const filter = m => m.author.id === message.author.id;
      const msgTime = await message.channel.send('🎯 **Digite o nome do seu time:**');
      const nomeTimeMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return message.channel.send('❌ Tempo esgotado.');
      await nomeTimeMsg.delete();
      await msgTime.delete();

      // ------------------------------
      // PERGUNTA 2: Formato MD1 / MD3
      // ------------------------------
      const msgFormato = await message.channel.send('⚔️ **Escolha o formato da partida:** `MD1` ou `MD3`');
      const formatoMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!formatoMsg) return message.channel.send('❌ Tempo esgotado.');
      const formato = formatoMsg.content.toUpperCase() === 'MD3' ? 'MD3' : 'MD1';
      await formatoMsg.delete();
      await msgFormato.delete();

      // ------------------------------
      // CRIAR PARTIDA PENDENTE
      // ------------------------------
      const partida = {
        id: Date.now(),
        criador: message.author.id,
        nomeTime: nomeTimeMsg.content,
        formato,
        status: 'aguardando'
      };
      this.partidasPendentes.set(message.author.id, partida);

      // ------------------------------
      // MENSAGEM NO CANAL DE SOLICITAÇÕES
      // ------------------------------
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

      // ------------------------------
      // AGUARDAR INTERAÇÕES DE BOTÃO
      // ------------------------------
      const collector = msgSolicitacao.createMessageComponentCollector({ time: 86400000 }); // 24h

      collector.on('collect', async i => {
        // Cancelar partida - apenas admins
        if (i.customId === 'cancelarPartida') {
          if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return i.reply({ content: '❌ Apenas admins podem cancelar esta partida.', ephemeral: true });
          }
          await i.update({ content: `❌ Partida de **${partida.nomeTime}** cancelada pelo admin.`, embeds: [], components: [] });
          this.partidasPendentes.delete(partida.criador);
        }

        // Registrar resultado - apenas admins
        if (i.customId === 'resultadoPartida') {
          if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return i.reply({ content: '❌ Apenas admins podem registrar o resultado.', ephemeral: true });
          }
          const canalResultados = await message.guild.channels.fetch(canalResultadosID);
          await canalResultados.send(`🏆 Resultado da partida de **${partida.nomeTime}** registrado pelo admin <@${i.user.id}>!`);
          await i.update({ content: '✅ Resultado registrado!', embeds: [], components: [] });
          this.partidasPendentes.delete(partida.criador);
        }

        // Aceitar partida
        if (i.customId === 'aceitarPartida') {
          if (i.user.id === partida.criador) return i.reply({ content: '❌ Você não pode aceitar sua própria partida.', ephemeral: true });

          // Criar canal privado para os dois times
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
