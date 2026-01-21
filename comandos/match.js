const fs = require('fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const painel = require('./paineladmin');

module.exports = {
  name: 'match',

  async execute(message, args, client) {
    const canal = message.channel;

    // Verifica se args existe (MD1 ou MD3)
    const md = args[0]?.toUpperCase();
    if (!['MD1','MD3'].includes(md)) return message.reply('❌ Especifique o formato: MD1 ou MD3');

    const time1 = args[1];
    const time2 = args[2];
    if (!time1 || !time2) return message.reply('❌ Informe os dois times: .match MD1 Time1 Time2');

    const matchesArquivo = './data/matches.json';
    let matches = [];
    if (fs.existsSync(matchesArquivo)) matches = JSON.parse(fs.readFileSync(matchesArquivo, 'utf-8'));

    // Adiciona match
    matches.push({ id: Date.now().toString(), time1, time2, md, status: 'ativo' });
    fs.writeFileSync(matchesArquivo, JSON.stringify(matches, null, 2));

    // Mensagem de confirmação com botão de finalizar match
    const finalizarBotao = new ButtonBuilder()
      .setCustomId('finalizar_match_' + Date.now())
      .setLabel('✅ Finalizar Match')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(finalizarBotao);
    await canal.send({ content: `🎮 Match criado: **${time1} vs ${time2}** (${md})`, components: [row] });
    await message.delete().catch(() => {});

    // Atualiza painel automaticamente
    await painel.atualizarPainel(client);
  }
};
