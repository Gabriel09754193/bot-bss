const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "off",
  execute: async (message, args, client) => {
    // Verifica se quem enviou o comando é Administrador
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const embedManutencao = new EmbedBuilder()
      .setTitle("🛠️ Manutenção Programada")
      .setDescription("O **BSS Bot** entrará em modo de manutenção para atualizações do sistema.")
      .setColor("#FF8C00") // Dark Orange
      .addFields(
        { name: "Status", value: "🔴 Offline", inline: true },
        { name: "Ação", value: "Atualização de Comandos", inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Aguarde o retorno em instantes." });

    await message.channel.send({ embeds: [embedManutencao] });

    console.log(`🔴 Bot colocado em manutenção por: ${message.author.tag}`);

    // Aguarda 2 segundos para o Discord processar o envio da mensagem antes de encerrar
    setTimeout(() => {
      process.exit();
    }, 2000);
  },
};
