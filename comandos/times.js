const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'times',

  async execute(message) {
    const arquivo = './data/times.json';
    let times = [];

    if (fs.existsSync(arquivo)) {
      times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
    }

    if (times.length === 0) {
      return message.reply('❌ Nenhum time cadastrado ainda!');
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Times Inscritos')
      .setColor('#00ff99');

    times.forEach((time, i) => {
      embed.addFields({
        name: `${i + 1}. ${time.nome} (IGL: <@${time.igl}>)`,
        value: `🎮 Jogadores:\n${time.jogadores.join('\n')}`
      });
    });

    await message.reply({ embeds: [embed] });
    await message.delete().catch(() => {});
  }
};
