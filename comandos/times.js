const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
  nome: 'times',
  descricao: 'Mostrar tabela de times cadastrados na liga',
  
  timesPendentes: new Map(),

  async execute(message, args, client) {
    try {
      const MAX_TIMES = 12;
      const canal = message.channel;

      // --------------------------
      // Criar embed com times
      // --------------------------
      const embed = new EmbedBuilder()
        .setTitle('📋 Tabela de Times - Liga BSS')
        .setColor('Purple')
        .setFooter({ text: '🎯 Boa sorte a todos os times!' });

      const row = new ActionRowBuilder();

      let idx = 1;
      const slots = [];

      for (let i = 0; i < MAX_TIMES; i++) {
        const time = Array.from(this.timesPendentes.values())[i];

        if (time) {
          const jogadoresFormatados = time.jogadores
            .filter(j => j.nick !== '.')
            .map((j, index) => `👤 **Player ${index + 1}:** ${j.nick} | Função: ${j.funcao} | [Steam](${j.steam})`)
            .join('\n');

          slots.push(
            `────────────\n🏆 **Slot ${idx} - ${time.nomeTime}**\nIGL: <@${time.criador}>\n${jogadoresFormatados}\n────────────`
          );

          // Botão de remover para admins
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`removerTime_${time.criador}`)
              .setLabel(`❌ Remover Slot ${idx}`)
              .setStyle(ButtonStyle.Danger)
          );

        } else {
          slots.push(`────────────\n⚠️ **Slot ${idx} - Vazio**\nNenhuma equipe cadastrada.\n────────────`);
        }

        idx++;
      }

      embed.setDescription(slots.join('\n'));

      const msg = await canal.send({ embeds: [embed], components: [row] });

      // --------------------------
      // Collector para remover times
      // --------------------------
      const collector = msg.createMessageComponentCollector({ time: 3600000 }); // 1h

      collector.on('collect', async i => {
        if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return i.reply({ content: '❌ Apenas admins podem remover times.', ephemeral: true });
        }

        const criadorId = i.customId.split('_')[1];
        const timeRemovido = this.timesPendentes.get(criadorId);

        if (!timeRemovido) {
          return i.reply({ content: '❌ Time não encontrado ou já removido.', ephemeral: true });
        }

        // Remove o time
        this.timesPendentes.delete(criadorId);

        // Atualiza embed
        let idxAtual = 1;
        const slotsAtualizados = [];
        const rowAtualizada = new ActionRowBuilder();

        for (let t of Array.from(this.timesPendentes.values())) {
          const jogadoresFormatados = t.jogadores
            .filter(j => j.nick !== '.')
            .map((j, index) => `👤 **Player ${index + 1}:** ${j.nick} | Função: ${j.funcao} | [Steam](${j.steam})`)
            .join('\n');

          slotsAtualizados.push(
            `────────────\n🏆 **Slot ${idxAtual} - ${t.nomeTime}**\nIGL: <@${t.criador}>\n${jogadoresFormatados}\n────────────`
          );

          // Adiciona novamente botão de remover
          rowAtualizada.addComponents(
            new ButtonBuilder()
              .setCustomId(`removerTime_${t.criador}`)
              .setLabel(`❌ Remover Slot ${idxAtual}`)
              .setStyle(ButtonStyle.Danger)
          );

          idxAtual++;
        }

        // Preencher slots vazios
        for (; idxAtual <= MAX_TIMES; idxAtual++) {
          slotsAtualizados.push(`────────────\n⚠️ **Slot ${idxAtual} - Vazio**\nNenhuma equipe cadastrada.\n────────────`);
        }

        const embedAtualizado = new EmbedBuilder()
          .setTitle('📋 Tabela de Times - Liga BSS')
          .setColor('Purple')
          .setDescription(slotsAtualizados.join('\n'))
          .setFooter({ text: '🎯 Boa sorte a todos os times!' });

        await i.update({ embeds: [embedAtualizado], components: [rowAtualizada] });
        await i.followUp({ content: `✅ Time **${timeRemovido.nomeTime}** removido pelo admin <@${i.user.id}>`, ephemeral: true });
      });

    } catch (err) {
      console.error('Erro ao exibir tabela de times:', err);
      message.channel.send('❌ Ocorreu um erro ao exibir a tabela de times.');
    }
  }
};
