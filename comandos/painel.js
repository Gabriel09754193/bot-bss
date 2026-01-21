const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'painel',

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor('#2f3136')
      .setTitle('🎮 Painel Oficial de Matches')
      .setDescription(
`👑 **COMANDOS PARA IGL**

🔹 **.inscricao**
Inscreva seu time informando nome da equipe, jogadores e IGL.

🔹 **.match**
Crie um pedido de match escolhendo **MD1** ou **MD3**.
Outro IGL poderá aceitar o desafio.

📊 **FUNCIONALIDADES AUTOMÁTICAS**
✔ Criação de chat privado
✔ Registro de resultados
✔ Histórico de partidas

🏆 **EM BREVE**
⭐ MVP automático
📈 Estatísticas por equipe
🔥 Sistema de invicto
🎁 Premiações

📌 Use os comandos corretamente e respeite as regras.`
      )
      .setFooter({ text: 'Sistema de Matches • Automático' });

    await message.channel.send({ embeds: [embed] });

    // apaga o comando digitado
    await message.delete().catch(() => {});
  }
};
