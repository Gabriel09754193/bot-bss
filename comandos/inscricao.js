const fs = require('fs');
const painel = require('./paineladmin');

module.exports = {
  name: 'inscricao',

  async execute(message, args, client) {
    const nomeTime = args[0];
    const igl = message.author.id;
    const jogadores = args.slice(1);

    if (!nomeTime) return message.reply('❌ Use: .inscricao NomeDoTime Jogador1 Jogador2 ...');

    const arquivo = './data/times.json';
    let times = [];
    if (fs.existsSync(arquivo)) times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));

    // Verifica se o time já existe
    if (times.find(t => t.nome.toLowerCase() === nomeTime.toLowerCase()))
      return message.reply('❌ Esse time já está cadastrado!');

    times.push({ nome: nomeTime, igl, jogadores });
    fs.writeFileSync(arquivo, JSON.stringify(times, null, 2));

    await message.reply(`✅ Time **${nomeTime}** cadastrado com sucesso!`);
    await message.delete().catch(()=>{});

    // Atualiza painel automaticamente
    await painel.atualizarPainel(client);
  }
};
