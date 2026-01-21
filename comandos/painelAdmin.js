const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'paineladmin',

  async execute(message) {
    // Verifica se é admin ou IGL
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Apenas admins podem usar este painel!');
    }

    // Lê times
    const timesArquivo = './data/times.json';
    let times = [];
    if (fs.existsSync(timesArquivo)) {
      times = JSON.parse(fs.readFileSync(timesArquivo, 'utf-8'));
    }

    // Lê matches
    const matchesArquivo = './data/matches.json';
    let matches = [];
    if (fs.existsSync(matchesArquivo)) {
      matches = JSON.parse(fs.readFileSync(matchesArquivo, 'utf-8'));
    }

    // Cria embed
    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('🔒 Painel Admin - Estatísticas Privadas')
      .setDescription('Aqui você vê todos os times, matches ativos e status dos comandos.');

    // Times cadastrados
    if (times.length === 0) {
      embed.addFields({ name: '📋 Times Cadastrados', value: 'Nenhum time registrado ainda.' });
    } else {
      embed.addFields({
        name: '📋 Times Cadastrados',
        value: times.map(t => `${t.nome} (IGL: <@${t.igl}>)`).join('\n')
      });
    }

    // Matches ativos
    if (matches.length === 0) {
      embed.addFields({ name: '🎮 Matches Ativos', value: 'Nenhum match ativo.' });
    } else {
      embed.addFields({
        name: '🎮 Matches Ativos',
        value: matches.map(m => `${m.time1} vs ${m.time2} (${m.md})`).join('\n')
      });
    }

    // Comandos implementados
    embed.addFields({
      name: '🛠 Comandos Disponíveis',
      value: '.inscricao, .times, .match, .removetime, .painel'
    });

    // Futuras funcionalidades
    embed.addFields({
      name: '🔜 Futuras Funcionalidades',
      value: 'Ranking automático, MVP, Invicto, Estatísticas detalhadas, Premiações'
    });

    // Envia e fixa a mensagem
    const msg = await message.channel.send({ embeds: [embed] });
    await message.delete().catch(() => {});
    if (!msg.pinned) await msg.pin();
  }
};
