const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "denunciar",
  execute: async (message, args, client) => {
    const canalStaffId = "1471161577087438910";
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    await message.delete().catch(() => {});

    try {
      const dm = await message.author.send("🛡️ **Central de Denúncias BSS**\nSeu anonimato está garantido. Responda às perguntas abaixo:");
      const filter = m => m.author.id === message.author.id;
      
      await dm.channel.send("1️⃣ **Alvo:** Qual o nome do Jogador ou Time?");
      const r1 = await dm.channel.awaitMessages({ filter, max: 1, time: 60000 });
      
      await dm.channel.send("2️⃣ **Motivo:** O que aconteceu?");
      const r2 = await dm.channel.awaitMessages({ filter, max: 1, time: 60000 });

      await dm.channel.send("3️⃣ **Provas:** Cole links de vídeos ou prints aqui:");
      const r3 = await dm.channel.awaitMessages({ filter, max: 1, time: 60000 });

      const embedStaff = new EmbedBuilder()
        .setAuthor({ name: "🚨 NOVA DENÚNCIA ANÔNIMA", iconURL: logoBSS })
        .setColor("#F1C40F")
        .setThumbnail(logoBSS)
        .addFields(
          { name: "👤 Infrator", value: `\`${r1.first().content}\``, inline: true },
          { name: "🆔 Caso", value: `#${Math.floor(Math.random() * 9000) + 1000}`, inline: true },
          { name: "📝 Relato", value: `\`\`\`text\n${r2.first().content}\n\`\`\`` },
          { name: "🔗 Evidências", value: r3.first().content }
        )
        .setTimestamp()
        .setFooter({ text: "O denunciante não foi identificado." });

      const canalStaff = client.channels.cache.get(canalStaffId);
      if (canalStaff) await canalStaff.send({ embeds: [embedStaff] });

      await dm.channel.send("✅ **Enviado!** Sua denúncia foi entregue à diretoria.");
    } catch {
      await message.author.send("❌ Erro: Sua DM está fechada ou o tempo expirou.");
    }
  }
};
