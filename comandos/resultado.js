const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "resultado",
  async execute(message, args, client) {
    // Apenas Admins podem usar
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem postar resultados.");
    }

    const IDS = {
      RESULTADOS: "1463260797604987014" // ID que você passou no código anterior
    };

    const perguntas = [
      "⚔️ **Quais foram os times?** (Ex: Time A vs Time B)",
      "📊 **Qual foi o placar?**",
      "💀 **Qual a eliminação total?**",
      "🌟 **Quem foi o MVP da partida?**",
      "📅 **Qual a data da partida?**",
      "🗺️ **Quais foram os mapas jogados?**",
      "🛡️ **Administração presente?**",
      "🖼️ **Envie o LINK da foto do resultado** (ou digite `.` para pular):"
    ];

    let respostas = [];
    let atual = 0;

    const filter = m => m.author.id === message.author.id;
    const msgStatus = await message.channel.send(`📋 **Iniciando relatório de partida...**\n\n${perguntas[atual]}`);

    const coletor = message.channel.createMessageCollector({ filter, time: 300000 }); // 5 minutos de prazo

    coletor.on('collect', async m => {
      // Se for ".", salvamos como "Não informado" ou vazio
      const info = m.content === "." ? "Não informado" : m.content;
      respostas.push(info);
      
      m.delete().catch(() => {});
      atual++;

      if (atual < perguntas.length) {
        msgStatus.edit(`${perguntas[atual]}`);
      } else {
        coletor.stop();
      }
    });

    coletor.on('end', async (collected, reason) => {
      if (reason === 'time') {
        return message.reply("⏳ Tempo esgotado! O comando de resultado foi cancelado.");
      }

      msgStatus.delete().catch(() => {});

      const canalRes = await client.channels.fetch(IDS.RESULTADOS);
      
      const embedFinal = new EmbedBuilder()
        .setTitle("🏆 RELATÓRIO DE PARTIDA OFICIAL")
        .setColor("#00FF00")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: "⚔️ Confronto", value: respostas[0], inline: false },
          { name: "📊 Placar Final", value: `\`${respostas[1]}\``, inline: true },
          { name: "💀 Eliminações", value: `\`${respostas[2]}\``, inline: true },
          { name: "🌟 MVP", value: respostas[3], inline: true },
          { name: "📅 Data", value: respostas[4], inline: true },
          { name: "🗺️ Mapas", value: respostas[5], inline: true },
          { name: "🛡️ Staff Presente", value: respostas[6], inline: true }
        )
        .setFooter({ text: "BSS E-sports | Resultados Oficiais", iconURL: message.guild.iconURL() })
        .setTimestamp();

      // Se a última resposta for um link (não for "."), adiciona a imagem
      if (respostas[7] !== "Não informado" && respostas[7].startsWith("http")) {
        embedFinal.setImage(respostas[7]);
      }

      await canalRes.send({ embeds: [embedFinal] });
      message.channel.send("✅ **Resultado postado com sucesso no canal de resultados!**");
    });
  },
};
