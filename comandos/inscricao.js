const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inscricao')
    .setDescription('Cadastrar seu time na competição'),

  async execute(interaction) {
    // Criar modal
    const modal = new ModalBuilder()
      .setCustomId('inscricaoModal')
      .setTitle('Cadastro do Time');

    const nomeTime = new TextInputBuilder()
      .setCustomId('nomeTime')
      .setLabel('Nome do Time')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const jogadores = new TextInputBuilder()
      .setCustomId('jogadores')
      .setLabel('Função e nick dos jogadores (ex: IGL: Player1)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(nomeTime);
    const row2 = new ActionRowBuilder().addComponents(jogadores);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);

    // Esperar submissão do modal
    const filter = i => i.customId === 'inscricaoModal' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

    collector.on('collect', async i => {
      if (!i.isModalSubmit()) return;

      const nome = i.fields.getTextInputValue('nomeTime');
      const players = i.fields.getTextInputValue('jogadores');

      // Salvar no times.json
      const filePath = path.join(__dirname, '../data/times.json');
      let times = [];
      if (fs.existsSync(filePath)) {
        times = JSON.parse(fs.readFileSync(filePath));
      }

      times.push({
        id: i.user.id,
        nome,
        jogadores: players.split('\n')
      });

      fs.writeFileSync(filePath, JSON.stringify(times, null, 2));

      // Mensagem de confirmação
      await i.reply({ content: `✅ Time **${nome}** registrado com sucesso!`, ephemeral: true });
    });
  }
};
