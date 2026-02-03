const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "resultado",
  async execute(message, args, client) {
    // Segurança: Apenas administradores
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem postar resultados.");
    }

    // ID ATUALIZADO DO CANAL DE RESULTADOS
    const CANAL_RESULTADOS_ID = "1468379693723160617"; 

    const perguntas = [
      "⚔️ **Quais foram os times?** (Ex: Time A vs Time B)",
      "📊 **Qual foi o placar?**",
      "💀 **Quais foram as eliminações totais?**",
      "🌟 **Quem foi o MVP da partida?**",
      "📅 **Qual a data da partida?**",
      "🗺️ **Quais foram os mapas jogados?**",
      "🛡️ **Administração presente?**",
      "🖼️ **Envie o LINK da foto do resultado** (ou digite `.` para pular):"
    ];

    let respostas = [];
    let atual = 0;

    const filter = m => m.author.id === message.author.id;
    let msgStatus = await message.channel.send(`📋 **Iniciando relatório oficial...**\n\n${perguntas[atual]}`);

    const coletor = message.channel.createMessageCollector({ filter, time: 600000 }); // 10 minutos para preencher

    coletor.on('collect', async m => {
      const info = m.content === "." ? "Não informado" : m.content;
      respostas.push(info);
      
      // Tenta apagar a resposta do admin para manter o chat limpo
      try { await m.delete(); } catch (e) {}

      atual++;

      if (atual < perguntas.length) {
        // Tenta editar a pergunta atual
        try {
          await msgStatus.edit(`${perguntas[atual]}`);
        } catch (e) {
          // Se o admin apagou a mensagem do bot sem querer, ele envia uma nova
          msgStatus = await message.channel.send(`${perguntas[atual]}`);
        }
      } else {
        coletor.stop();
      }
    });

    coletor.on('end', async (collected, reason) => {
      if (reason === 'time') return message.reply("⏳ Tempo esgotado! O comando foi cancelado.");

      // Limpa a última mensagem de pergunta
      try { await msgStatus.delete(); } catch (e) {}

      // Busca o canal de destino com segurança
      const canalRes = client.channels.cache.get(CANAL_RESULTADOS_ID) || await client.channels.fetch(CANAL_RESULTADOS_ID).catch(() => null);

      if (!canalRes) {
        return message.channel.send("❌ **ERRO:** Não consegui encontrar o canal de resultados. Verifique as permissões do bot.");
      }

      const embedFinal = new EmbedBuilder()
        .setTitle("🏆 RELATÓRIO DE PARTIDA OFICIAL")
        .setColor("#00FF00")
        .setThumbnail(message.guild.iconURL())
        .addFields(
          { name: "⚔️ Confronto", value: `**${respostas[0]}**`, inline: false },
          { name: "📊 Placar Final", value: `\`${respostas[1]}\``, inline: true },
          { name: "💀 Eliminações", value: `\`${respostas[2]}\``, inline: true },
          { name: "🌟 MVP", value: respostas[3], inline: true },
          { name: "📅 Data", value: respostas[4], inline: true },
          { name: "🗺️ Mapas", value: respostas[5], inline: true },
          { name: "🛡️ Staff Presente", value: respostas[6], inline: true }
        )
        .setFooter({ text: "BSS E-sports | Sistema de Resultados", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      // Adiciona imagem se o link for válido
      if (respostas[7] !== "Não informado" && respostas[7].startsWith("http")) {
        embedFinal.setImage(respostas[7]);
      }

      // Envia o resultado final para o canal alvo
      await canalRes.send({ embeds: [embedFinal] }).catch(() => {
        message.channel.send("❌ Erro ao enviar para o canal de resultados. Verifique as permissões!");
      });

      message.channel.send("✅ **Relatório enviado com sucesso para o canal de resultados!**");
    });
  },
};
