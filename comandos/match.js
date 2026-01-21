const fs = require('fs');
const painel = require('./paineladmin');

module.exports = {
  name: 'match',

  async execute(message, args, client) {
    const md = args[0]?.toUpperCase();
    const time1 = args[1];
    const time2 = args[2];

    if (!['MD1','MD3'].includes(md)) return message.reply('❌ Formato inválido! Use MD1 ou MD3.');
    if (!time1 || !time2) return message.reply('❌ Informe os dois times: .match MD1 Time1 Time2');

    const arquivo = './data/matches.json';
    let matches = [];
    if (fs.existsSync(arquivo)) matches = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));

    matches.push({ id: Date.now().toString(), time1, time2, md, status: 'ativo' });
    fs.writeFileSync(arquivo, JSON.stringify(matches, null, 2));

    await message.reply(`🎮 Match criado: **${time1} vs ${time2}** (${md})`);
    await message.delete().catch(()=>{});

    // Atualiza painel automaticamente
    await painel.atualizarPainel(client);
  }
};
