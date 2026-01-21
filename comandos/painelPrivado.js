const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'painelprivado',

  async execute(message) {
    // Verifica se o canal é permitido (opcional)
    // Você pode colocar um canal privado específico
    // Exemplo: if(message.channel.id !== 'ID_DO_CANAL_PRIVADO') return;

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🔒 Painel Privado - Comandos IGL/Staff')
      .setDescription('Aqui você encontra todos os comandos e funcionalidades do servidor relacionados a times e partidas.');

    // Comandos
    embed.addFields(
      {
        name: '📝 .inscricao',
        value: 'Inscrever um time no servidor.\nIGL informa nome do time e jogadores.'
      },
      {
        name: '📋 .times',
        value: 'Lista todos os times cadastrados no servidor.'
      },
      {
        name: '🎮 .match',
        value: 'Cria um match, escolha MD1 ou MD3.\nOutro IGL pode aceitar. Bot cria chat privado automaticamente.'
      },
      {
        name: '❌ .removetime',
        value: 'Remove um time do banco de dados.\nApenas admins podem usar.'
      },
      {
        name: '🔜 Futuras funcionalidades',
        value: '- Ranking automático\n- Sistema de invicto\n- MVP automático\n- Estatísticas detalhadas\n- Premiações'
      }
    );

    // Envia o embed
    const msg = await message.channel.send({ embeds: [embed] });

    // Apaga o comando digitado
    await message.delete().catch(() => {});

    // Opcional: fixa a mensagem
    if (!msg.pinned) await msg.pin();
  }
};
