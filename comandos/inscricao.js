const fs = require('fs');
const path = require('path');

const CANAL_INSCRICAO_ID = '1463260686011338814';
const CARGO_IGL_ID = '1463258074310508765';
const MAX_TIMES = 16;

const filePath = path.join(__dirname, '../data/times.json');

function load() {
  return JSON.parse(fs.readFileSync(filePath));
}
function save(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  nome: 'inscricao',

  async execute(message) {
    if (message.channel.id !== CANAL_INSCRICAO_ID)
      return message.reply('❌ Use este comando apenas no canal de inscrição.');

    if (!message.member.roles.cache.has(CARGO_IGL_ID))
      return message.reply('❌ Apenas IGLs podem usar este comando.');

    const data = load();

    if (data.slots.length >= MAX_TIMES)
      return message.reply('❌ Limite de times atingido.');

    if (data.slots.find(t => t.igl === message.author.id))
      return message.reply('❌ Você já cadastrou um time.');

    await message.reply('📩 Confira seu privado para continuar.');

    const dm = await message.author.createDM();
    const filter = m => m.author.id === message.author.id;

    await dm.send('🏷 **Nome do time:**');
    const nome = (await dm.awaitMessages({ filter, max: 1, time: 60000 })).first();
    if (!nome) return dm.send('⏰ Tempo esgotado.');

    const jogadores = [];

    for (let i = 1; i <= 5; i++) {
      await dm.send(
        `🎮 **Player ${i}**\nFormato:\n\`Nick | Função | LINK do Perfil Steam\``
      );
      const r = (await dm.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!r) return dm.send('⏰ Tempo esgotado.');
      jogadores.push(r.content);
    }

    data.slots.push({
      slot: data.slots.length + 1,
      nome: nome.content,
      igl: message.author.id,
      jogadores
    });

    save(data);

    await dm.send(
      `✅ **Equipe ${nome.content} registrada com sucesso!**\n\nBoa sorte na liga 🏆`
    );
  }
};
