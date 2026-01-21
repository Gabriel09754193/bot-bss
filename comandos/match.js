const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
  nome: 'match',
  descricao: 'Criar uma partida',
  partidasPendentes: new Map(), // Limite de 1 partida por IGL

  async execute(message, args) {
    const canalSolicitacoesID = '1463270016303759504'; // Canal público de solicitações
    const categoriaPartidasID = '1463269500920266966'; // Categoria para canais privados
    const canalResultadosID = '1463260797604987014'; // Canal onde resultados serão postados

    if (this.partidasPendentes.has(message.author.id)) {
      return message.reply('❌ Você já possui uma partida pendente. Aguarde até ser aceita ou cancelada.');
    }

    // Deletar mensagem inicial
    try { await message.delete(); } catch {}

    const filter = m => m.author.id === message.author.id;

    try {
      // Pergunta 1: Nome do time
      const msgTime = await message.channel.send('🎯 **Digite o nome do seu time:**');
      const nomeTimeMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return message.channel.send('❌ Tempo esgotado.');
      await nomeTimeMsg.delete();
      await msgTime.delete();

      // Pergunta 2: Formato MD1/MD3
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
      const embed = new MessageEmbed()
        .setTitle('🎮 Partida Solicitada')
        .addField('Time', partida.nomeTime, true)
        .addField('IGL', `<@${message.author.id}>`, true)
        .addField('Formato', partida.formato, true)
        .setDescription(`Aguardando aceitação de outro time.\nVocê pode cancelar esta partida a qualquer momento.`)
        .setColor('BLURPLE');

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`aceitar_${partida.id}`)
            .setLabel('✅ Aceitar partida')
            .setStyle('SUCCESS'),
          new MessageButton()
            .setCustomId(`cancelar_${partida.id}`)
            .setLabel('❌ Cancelar partida')
            .setStyle('DANGER')
        );

      const solicitacaoMsg = await canalSolicitacoes.send({ embeds: [embed], components: [row] });

      await message.channel.send(`✅ Sua solicitação foi enviada para <#${canalSolicitacoesID}>!`);

      // Collector para botões
      const collector = solicitacaoMsg.createMessageComponentCollector({ time: 3600000 }); // 1 hora
      collector.on('collect', async i => {
        // Aceitar partida
        if (i.customId === `aceitar_${partida.id}`) {
          if (i.user.id === message.author.id) {
            return i.reply({ content: '❌ Você não pode aceitar sua própria partida.', ephemeral: true });
          }

          // Criar canal privado da partida
          const categoria = await message.guild.channels.fetch(categoriaPartidasID);
          const canalPartida = await message.guild.channels.create(`partida-${partida.id}`, {
            type: 'GUILD_TEXT',
            parent: categoria.id,
            permissionOverwrites: [
              { id: message.guild.id, deny: ['VIEW_CHANNEL'] },
              { id: message.author.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] },
              { id: i.user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
            ]
          });

          // Mensagem inicial no canal privado
          const embedPrivado = new MessageEmbed()
            .setTitle(`🎮 Partida ${partida.formato}`)
            .addField('Time A', `${partida.nomeTime} (<@${message.author.id}>)`, true)
            .addField('Time B', `${i.user.username}`, true)
            .addField('Status', '✅ Aguardando início', false)
            .setColor('GREEN')
            .setDescription(`⚠️ Observações:
- Apenas **admins** podem cancelar a partida.
- Registrar resultado envia mensagem automática para <#${canalResultadosID}>.`);

          const rowPrivado = new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId(`admin_cancelar_${partida.id}`)
                .setLabel('🛑 Cancelar partida')
                .setStyle('DANGER')
                .setDisabled(false), // Para admins, você checa permissões depois
              new MessageButton()
                .setCustomId(`admin_resultado_${partida.id}`)
                .setLabel('📝 Registrar resultado')
                .setStyle('PRIMARY')
                .setDisabled(false) // Para admins
            );

          await canalPartida.send({ embeds: [embedPrivado], components: [rowPrivado] });

          // Atualizar status e remover da lista pendente
          partida.status = 'aceita';
          this.partidasPendentes.delete(message.author.id);
          await solicitacaoMsg.delete();
          await i.reply({ content: `✅ Partida aceita! Canal privado criado: ${canalPartida}`, ephemeral: true });
        }

        // Cancelar partida
        if (i.customId === `cancelar_${partida.id}`) {
          if (i.user.id !== message.author.id && !i.member.permissions.has('ADMINISTRATOR')) {
            return i.reply({ content: '❌ Apenas o criador ou admins podem cancelar a partida.', ephemeral: true });
          }

          this.partidasPendentes.delete(message.author.id);
          await solicitacaoMsg.delete();
          await i.reply({ content: '❌ Partida cancelada.', ephemeral: true });
        }
      });
    } catch (err) {
      console.error(err);
      message.channel.send('❌ Ocorreu um erro ao criar a partida.');
    }
  }
};
