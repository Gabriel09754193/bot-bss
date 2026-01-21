const fs = require('fs');
const path = require('path');

module.exports = {
  nome: 'inscricao',
  descricao: 'Cadastrar seu time',
  async execute(message, args) {
    const filter = m => m.author.id === message.author.id;
    const channel = message.channel;

    await channel.send('Digite o nome do seu time:');

    const nomeTime = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
    if (!nomeTime) return channel.send('❌ Tempo esgotado.');

    await channel.send('Digite os jogadores e suas funções (uma linha por jogador):');
    const jogadoresMsg = (await channel.awaitMessages({ filter, max: 1, time: 120000 })).first();
    if (!jogadoresMsg) return channel.send('❌ Tempo esgotado.');

    const filePath = path.join(__dirname, '../data/times.json');
    let times = [];
    if (fs.existsSync(filePath)) {
      times = JSON.parse(fs.readFileSync(filePath));
    }

    times.push({
      id: message.author.id,
      nome: nomeTime.content,
      jogadores: jogadoresMsg.content.split('\n')
    });

    fs.writeFileSync(filePath, JSON.stringify(times, null, 2));

    channel.send(`✅ Time **${nomeTime.content}** registrado com sucesso!`);
  }
};
