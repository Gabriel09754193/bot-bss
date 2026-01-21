const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'times',
  async execute(message) {
    const arquivo = './data/times.json';
    let times = [];
    if (fs.existsSync(arquivo)) times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));

    if (times.length === 0) return message.reply('❌ Nenhum time cadastrado!');

    const embed = new EmbedBuilder()
      .setTitle('📋 Times Cadastrados')
      .setColor('#00ff99')
      .addFields(times.map((t, i) => ({
        name: `${i+1}. ${t.nome} (IGL: <@${t.igl}>)`,
        value: `🎮 Jogadores:\n${t.jogadores.join('\n')}`
      })));

    await message.reply({ embeds: [embed] });
    await message.delete().catch(() => {});
  }
};
