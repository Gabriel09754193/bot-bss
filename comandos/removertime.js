const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  nome: "removertime",

  async execute(message, args) {
    // 🔒 Apenas admins
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const timesData = global.timesData || [];

    if (timesData.length === 0) {
      return message.reply("❌ Não há equipes cadastradas.");
    }

    const slot = parseInt(args[0]);

    if (!slot || slot < 1 || slot > 16) {
      return message.reply("❌ Use: `.removertime <slot>` (1 a 16)");
    }

    const index = timesData.findIndex(t => t.slot === slot);

    if (index === -1) {
      return message.reply(`❌ Nenhuma equipe encontrada no slot **${slot}**.`);
    }

    const timeRemovido = timesData[index];

    // ❌ Remover time
    timesData.splice(index, 1);

    // 🔄 Reorganizar slots
    timesData.forEach((time, i) => {
      time.slot = i + 1;
    });

    await message.channel.send(
      `🗑️ **Equipe removida com sucesso!**\n\n` +
      `🏷️ **Equipe:** ${timeRemovido.nome}\n` +
      `👑 **IGL:** <@${timeRemovido.igl}>\n` +
      `📍 Slot liberado e tabela reorganizada.`
    );
  }
};
