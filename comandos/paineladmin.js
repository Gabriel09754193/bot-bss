const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const CANAL_PRIVADO = 'SEU_CANAL_PRIVADO_ID'; // coloque o ID do canal privado
const TIMES_JSON = './data/times.json';
const MATCHES_JSON = './data/matches.json';

module.exports = {
  name: 'paineladmin',
  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) 
      return message.reply('❌ Apenas admins podem usar este painel!');

    const canal = await client.channels.fetch(CANAL_PRIVADO);
    if (!canal) return;

    let times = [];
    if (fs.existsSync(TIMES_JSON)) times = JSON.parse(fs.readFileSync(TIMES_JSON, 'utf-8'));

    let matches = [];
    if (fs.existsSync(MATCHES_JSON)) matches = JSON.parse(fs.readFileSync(MATCHES_JSON, 'utf-8'));

    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('🔒 Painel Admin')
      .setDescription('Atualizado manualmente com os dados do servidor.')
      .addFields(
        { name: '📋 Times Cadastrados', value: times.length===0 ? 'Nenhum time registrado.' : times.map(t => `${t.nome} (IGL: <@${t.igl}>)`).join('\n') },
        { name: '🎮 Matches Ativos', value: matches.length===0 ? 'Nenhum match ativo.' : matches.map(m => `${m.time1} vs ${m.time2} (${m.md})`).join('\n') },
        { name: '🛠 Comandos Disponíveis', value: '.inscricao, .times, .match, .removetime' }
      );

    await canal.send({ embeds: [embed] });
    await message.delete().catch(()=>{});
  }
};
