const fs = require('fs');

module.exports = {
  name: 'removetime',

  async execute(message, args) {
    // Verifica se o usuário é admin
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Você não tem permissão para usar este comando!');
    }

    const nomeTime = args.join(' '); // pega o nome do time digitado
    if (!nomeTime) {
      return message.reply('❌ Você precisa informar o nome do time. Ex: `.removetime NomeDoTime`');
    }

    const arquivo = './data/times.json';
    if (!fs.existsSync(arquivo)) {
      return message.reply('❌ Nenhum time cadastrado ainda.');
    }

    let times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
    const timeIndex = times.findIndex(t => t.nome.toLowerCase() === nomeTime.toLowerCase());

    if (timeIndex === -1) {
      return message.reply(`❌ Não encontrei nenhum time chamado **${nomeTime}**.`);
    }

    // Remove o time
    const removed = times.splice(timeIndex, 1);
    fs.writeFileSync(arquivo, JSON.stringify(times, null, 2));

    await message.reply(`✅ Time **${removed[0].nome}** removido com sucesso!`);

    // apaga a mensagem do comando
    await message.delete().catch(() => {});
  }
};
