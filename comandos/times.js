const { EmbedBuilder } = require('discord.js');

module.exports = {
  nome: 'times',
  descricao: 'Lista todas as equipes cadastradas',
  timesPendentes: new Map(),

  async execute(message, args) {
    try {
      const LIMITE_EQUIPES = 12;
      const times = Array.from(this.timesPendentes.values());

      const embed = new EmbedBuilder()
        .setTitle('🏆 Painel de Times - Liga BSS')
        .setColor('Blurple')
        .setDescription('Confira abaixo as equipes cadastradas na liga:\n\n🟢 Slot preenchido  |  ⚪ Slot vazio');

      for (let i = 0; i < LIMITE_EQUIPES; i++) {
        const time = times[i];
        if (time) {
          // Jogadores com perfis Steam clicáveis
          const jogadoresFormatados = time.jogadores.map((j, idx) => {
            if (j === '.') return `Jogador ${idx + 1}: ❌`;
            const steam = time.perfisSteam[idx] !== '.' ? `[Steam](${time.perfisSteam[idx]})` : '';
            return `**${j}** ${steam}`;
          }).join('\n');

          embed.addFields({
            name: `🟢 Slot ${i + 1}: ${time.nomeTime}`,
            value: `**IGL:** <@${time.criador}>\n${jogadoresFormatados}`,
            inline: false
          });
        } else {
          embed.addFields({
            name: `⚪ Slot ${i + 1}: Vazio`,
            value: 'Nenhuma equipe cadastrada ainda.',
            inline: false
          });
        }
      }

      await message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao listar times:', err);
      message.channel.send('❌ Ocorreu um erro ao listar as equipes.');
    }
  }
};
