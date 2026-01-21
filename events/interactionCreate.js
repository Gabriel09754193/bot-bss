const fs = require('fs');
const { InteractionType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'inscricaoModal') {
      const nomeTime = interaction.fields.getTextInputValue('nomeTime');
      const jogadores = interaction.fields.getTextInputValue('jogadores').split(',').map(j => j.trim());
      const igl = interaction.user.id;

      const arquivo = './data/times.json';
      let times = [];
      if (fs.existsSync(arquivo)) times = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));

      if (times.find(t => t.nome.toLowerCase() === nomeTime.toLowerCase())) {
        await interaction.reply({ content: '❌ Esse time já está cadastrado!', ephemeral: true });
        return;
      }

      // Salvar time no banco
      times.push({ nome: nomeTime, igl, jogadores });
      fs.writeFileSync(arquivo, JSON.stringify(times, null, 2));

      await interaction.reply({ content: `✅ Time **${nomeTime}** cadastrado com sucesso!`, ephemeral: true });
    }
  }
};
