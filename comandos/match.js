const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  nome: 'match',
  descricao: 'Criar uma partida',
  partidasPendentes: new Map(),

  async execute(message, args) {
    // ------------------------------
    // CONFIGURAÇÃO
    // ------------------------------
    const canalSolicitacoesID = '1463270089376927845'; // Canal público onde os IGLs verão as solicitações
    const categoriaPartidasID = '1463562210591637605'; // Categoria para canais privados das partidas
    const canalResultadosID = '1463260797604987014'; // Canal de resultados
    const canalPermitidoID = '1463270016303759504'; // Canal onde o comando pode ser usado
    const igls = ['1463258074310508765', '1463258074310508765', '1463258074310508765']; // IDs dos IGLs que podem usar o comando

    // ------------------------------
    // CHECAGEM DE CANAL
    // ------------------------------
    if (message.channel.id !== canalPermitidoID) {
      return message.reply(`❌ Este comando só pode ser usado em <#${canalPermitidoID}>.`);
    }

    // ------------------------------
    // CHECAGEM DE IGL
    // ------------------------------
    if (!igls.includes(message.author.id)) {
      return message.reply('❌ Apenas IGLs podem usar este comando.');
    }

    // ------------------------------
    // CHECAGEM DE PARTIDA PENDENTE
    // ------------------------------
    if (this.partidasPendentes.has(message.author.id)) {
      return message.reply('❌ Você já possui uma partida pendente.');
    }

    try {
      const filter = m => m.author.id === message.author.id;

      // ------------------------------
      // PERGUNTA 1: Nome do time
      // ------------------------------
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
        .setDescription(`⏳ Aguardando outro IGL aceitar a partida!\n\n⚠️ Você pode cancelar a partida a qualquer momento (apenas admins).`)
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

      await message.delete(); // Apaga a mensagem do comando
      await message.channel.send(`✅ Solicitação enviada para <#${canalSolicitacoesID}>`);

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
          await i.update({ content: `❌ Partida de **${partida.nomeTime}** cancelada pelo admin <@${i.user.id}>.`, embeds: [], components: [] });
          this.partidasPendentes.delete(partida.criador);
        }

        // Registrar resultado - apenas admins
        if (i.customId === 'resultadoPartida') {
          if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return i.reply({ content: '❌ Apenas admins podem registrar o resultado.', ephemeral: true });
          }

          const canalResultados = await message.guild.channels.fetch(canalResultadosID);

          // Pedir o resultado no pv do admin
          await i.user.send(`✏️ Informe o resultado da partida de **${partida.nomeTime}** (Ex: TimeA venceu TimeB por 2 x 0 nos mapas Train/Mirage):`);

          const dmFilter = m => m.author.id === i.user.id;
          const dmCollector = i.user.dmChannel.createMessageCollector({ filter: dmFilter, max: 1, time: 60000 });

          dmCollector.on('collect', async m => {
            await canalResultados.send(`🏆 **Resultado registrado:** ${m.content} (Registrado pelo admin <@${i.user.id}>)`);
            await i.reply({ content: '✅ Resultado registrado!', ephemeral: true });
            this.partidasPendentes.delete(partida.criador);
          });

          return;
        }

        // Aceitar partida
        if (i.customId === 'aceitarPartida') {
          if (!igls.includes(i.user.id)) {
            return i.reply({ content: '❌ Apenas IGLs podem aceitar partidas.', ephemeral: true });
          }
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
