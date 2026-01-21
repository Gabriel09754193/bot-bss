const fs = require('fs');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'inscricao',

  async execute(message, args) {
    // Criar modal
    const modal = new ModalBuilder()
      .setCustomId('inscricaoModal')
      .setTitle('Cadastro de Time');

    const nomeTimeInput = new TextInputBuilder()
      .setCustomId('nomeTime')
      .setLabel('Nome do Time')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite o nome do seu time')
      .setRequired(true);

    const jogadoresInput = new TextInputBuilder()
      .setCustomId('jogadores')
      .setLabel('Jogadores (separe por vírgula)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Jogador1, Jogador2, Jogador3')
      .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(nomeTimeInput);
    const secondRow = new ActionRowBuilder().addComponents(jogadoresInput);

    modal.addComponents(firstRow, secondRow);

    // Abrir modal
    await message.showModal(modal);

    // Evento temporário para coletar a submissão do modal
    const filter = i => i.user.id === message.author.id && i.customId === 'inscricaoModal';
    const collector = message.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async interaction => {
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

      // Criar botões de confirmação
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirmarTime')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancelarTime')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      await interaction.reply({
        content: `Você deseja registrar o time **${nomeTime}** com os jogadores: ${jogadores.join(', ')}?`,
        components: [row],
        ephemeral: true
      });

      // Coleção para botão
      const buttonCollector = interaction.channel.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 30000, max: 1 });

      buttonCollector.on('collect', async i => {
        if (i.customId === 'confirmarTime') {
          times.push({ nome: nomeTime, igl, jogadores });
          fs.writeFileSync(arquivo, JSON.stringify(times, null, 2));
          await i.update({ content: `✅ Time **${nomeTime}** cadastrado com sucesso!`, components: [] });
        } else if (i.customId === 'cancelarTime') {
          await i.update({ content: '❌ Cadastro cancelado!', components: [] });
        }
      });
    });
  }
};
