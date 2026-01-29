const { PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "formartime",

  async execute(message, args, client) {
    // TESTE DE VIDA
    console.log("FORMARTIME EXECUTADO");

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    if (message.mentions.members.size === 0) {
      return message.reply(
        "✅ **COMANDO FUNCIONANDO!**\n" +
        "Agora mencione os players.\n" +
        "Exemplo:\n`.formartime @player1 @player2`"
      );
    }

    return message.reply("🔥 Funcionou. Próximo passo: criar canal e botões.");
  }
};
