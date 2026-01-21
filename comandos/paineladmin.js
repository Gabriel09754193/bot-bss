const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const CANAL_PRIVADO = 'SEU_CANAL_PRIVADO_ID';
const TIMES_JSON = './data/times.json';
const MATCHES_JSON = './data/matches.json';

let painelMsgId = null;

async function atualizarPainel(client) {
  const canal = await client.channels.fetch(CANAL_PRIVADO);
  if (!canal) return;

  let times = [];
  if (fs.existsSync(TIMES_JSON)) times = JSON.parse(fs.readFileSync(TIMES_JSON, 'utf-8'));

  let matches = [];
  if (fs.existsSync(MATCHES_JSON)) matches = JSON.parse(fs.readFileSync(MATCHES_JSON, 'utf-8'));

  const embed = new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle('🔒 Painel Admin Automático')
    .setDescription('Atualizado automaticamente com times e matches do servidor.')
    .addFields(
      { name: '📋 Times Cadastrados', value: times.length===0 ? 'Nenhum time registrado.' : times.map(t => `${t.nome} (IGL: <@${t.igl}>)`).join('\n') },
      { name: '🎮 Matches Ativos', value: matches.length===0 ? 'Nenhum match ativo.' : matches.map(m => `${m.time1} vs ${m.time2} (${m.md})`).join('\n') },
      { name: '🛠 Comandos Disponíveis', value: '.inscricao, .times, .match, .removetime' },
      { name: '🔜 Futuras Funcionalidades', value: 'Ranking, MVP, Invicto, Estatísticas, Premiações' }
    );

  if (painelMsgId) {
    try {
      const msg = await canal.messages.fetch(painelMsgId);
      if (msg) return msg.edit({ embeds: [embed] });
    } catch {}
  }

  const msg = await canal.send({ embeds: [embed] });
  await msg.pin();
  painelMsgId = msg.id;
}

module.exports = {
  name: 'paineladmin',
  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) return message.reply('❌ Apenas admins podem usar este painel!');
    await atualizarPainel(client);
    await message.delete().catch(()=>{});
  },
  atualizarPainel
};
