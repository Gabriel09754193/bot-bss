const {
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const CATEGORY_ID = "1466237511658377236";

module.exports = {
  name: "formartime",

  async execute(client, message, args) {
    // teste de vida
    console.log("COMANDO FORMARTIME EXECUTADO");

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const players = message.mentions.members;

    if (players.size < 1) {
      return message.reply("⚠️ O comando respondeu. Agora mencione players.");
    }

    const categoria = message.guild.channels.cache.get(CATEGORY_ID);
    if (!categoria) {
      return message.reply("❌ Categoria não encontrada.");
    }

    await message.reply("✅ COMANDO FUNCIONANDO. Próximo passo: criar canal.");
  }
};
