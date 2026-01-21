const fs = require('fs');
const painel = require('./paineladmin');

module.exports = {
  name: 'removetime',

  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) return message.reply('❌ Apenas admins podem usar este comando!');

    const nomeTime = args.join(' ');
    if (!nomeTime) return message.reply('❌ Informe o nome do time: .removetime NomeDoTime');

    const arquivo = './data/times.json';
    if (!fs.existsSync(arquivo)) return message.reply('❌ Nenhum time cadastrado ainda.');

    let times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
    const index = times.findIndex(t => t.nome.toLowerCase() === nomeTime.toLowerCase());
    if (index === -1) return message.reply(`❌ Time ${nomeTime} não encontrado.`);

    times.splice(index,1);
    fs.writeFileSync(arquivo, JSON.stringify(times,null,2));

    await message.reply(`✅ Time **${nomeTime}** removido.`);
    await message.delete().catch(() => {});

    // Atualiza painel automaticamente
    await painel.atualizarPainel(client);
  }
};
