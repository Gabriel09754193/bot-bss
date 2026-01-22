const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  nome: "times",

  async execute(message) {
    // 🔒 Apenas admins
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const timesData = global.timesData || [];
    const TOTAL_SLOTS = 16;

    // 🧱 Montar descrição dos slots
    let descricao = "";

    for (let i = 1; i <= TOTAL_SLOTS; i++) {
      const time = timesData.find(t => t.slot === i);

      if (time) {
        descricao +=
          `**${i}️⃣ ${time.nome}**\n` +
          `👑 IGL: <@${time.igl}>\n` +
          `👥 Jogadores: ${time.jogadores.length}\n` +
          `━━━━━━━━━━━━━━━━━━\n`;
      } else {
        descricao +=
          `**${i}️⃣ SLOT VAZIO**\n` +
          `🚫 Nenhuma equipe cadastrada\n` +
          `━━━━━━━━━━━━━━━━━━\n`;
      }
    }

    // 🎨 Embed final
    const embed = new EmbedBuilder()
      .setTitle("📊 TIMES INSCRITOS — LIGA BSS")
      .setColor("Blue")
      .setDescription(descricao)
      .setFooter({ text: "Administração BSS • Atualizado em tempo real" });

    await message.channel.send({ embeds: [embed] });
  }
};
