const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  nome: 'match',
  descricao: 'Criar uma partida',
  partidasPendentes: new Map(),

  async execute(message, args) {
    // ------------------------------
    // CONFIGURAÇÕES
    // ------------------------------
    const cargoIGL_ID = '1463258074310508765';
    const canalPermitidoID = '1463270016303759504';
    const canalSolicitacoesID = '1463270089376927845';
    const categoriaPartidasID = '1463562210591637605';
    const canalResultadosID = '1463260797604987014';

    // ------------------------------
    // VERIFICAR CARGO E CANAL
    // ------------------------------
    if (!message.member.roles.cache.has(cargoIGL_ID)) return message.reply('❌ Apenas IGLs podem criar partidas.');
    if (message.channel.id !== canalPermitidoID) return message.reply(`❌ Comando disponível apenas no canal <#${canalPermitidoID}>.`);

    // ------------------------------
    // VERIFICAR PARTIDA PENDENTE
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
        .setDescription(`⏳ Aguardando outro IGL aceitar a partida!\n\n⚠️ Você pode cancelar esta partida quando quiser.`)
        .setFooter({ text: 'Apenas admins podem cancelar ou registrar o resultado.' });

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

      await message.delete(); // remove comando
      await message.channel.send(`✅ Solicitação enviada para <#${canalSolicitacoesID}>`);

      // ------------------------------
      // COLETOR DE BOTÕES
      // ------------------------------
      const collector = msgSolicitacao.createMessageComponentCollector({ time: 86400000 });

      collector.on('collect', async i => {
        // ------------------------------
        // Cancelar partida - Admins
        // ------------------------------
        if (i.customId === 'cancelarPartida') {
          if (!i.member.permissions.has(PermissionFlagsBits.Administrator))
            return i.reply({ content: '❌ Apenas admins podem cancelar esta partida.', ephemeral: true });

          await i.update({ content: `❌ Partida de **${partida.nomeTime}** cancelada pelo admin <@${i.user.id}>.`, embeds: [], components: [] });
          this.partidasPendentes.delete(partida.criador);
        }

        // ------------------------------
        // Resultado - Admins com Modal
        // ------------------------------
        if (i.customId === 'resultadoPartida') {
          if (!i.member.permissions.has(PermissionFlagsBits.Administrator))
            return i.reply({ content: '❌ Apenas admins podem registrar o resultado.', ephemeral: true });

          const modal = new ModalBuilder()
            .setCustomId(`resultadoModal-${partida.id}`)
            .setTitle('Registrar Resultado');

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

          const rowModal1 = new ActionRowBuilder().addComponents(vencedorInput);
          const rowModal2 = new ActionRowBuilder().addComponents(placarInput);

          modal.addComponents(rowModal1, rowModal2);

          await i.showModal(modal);
        }

        // ------------------------------
        // Aceitar partida
        // ------------------------------
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

      // ------------------------------
      // LIDAR COM SUBMISSÃO DE MODAL DE RESULTADO
      // ------------------------------
      message.client.on('interactionCreate', async interaction => {
        if (interaction.type !== 'ModalSubmit') return;
        if (!interaction.customId.startsWith('resultadoModal-')) return;

        const idPartida = interaction.customId.split('-')[1];
        if (!this.partidasPendentes.has(idPartida)) return;

        const vencedor = interaction.fields.getTextInputValue('vencedor');
        const placar = interaction.fields.getTextInputValue('placar');

        const canalResultados = await message.guild.channels.fetch(canalResultadosID);

        const embedResultado = new EmbedBuilder()
          .setTitle('🏆 Resultado da Partida')
          .setColor('Green')
          .addFields(
            { name: 'Time', value: vencedor, inline: true },
            { name: 'Placar', value: placar, inline: true }
          )
          .setFooter({ text: `Registrado pelo Admin ${interaction.user.tag}` });

        await canalResultados.send({ embeds: [embedResultado] });
        await interaction.reply({ content: '✅ Resultado registrado com sucesso!', ephemeral: true });
      });

    } catch (err) {
      console.error('Erro ao criar partida:', err);
      message.channel.send('❌ Ocorreu um erro ao criar a partida.');
    }
  }
};
