const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "removerplayer",
  execute: async (message, args, client) => {
    // Apenas Administradores
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canalDestinoId = "1471160378535710731";

    try {
      const filtro = m => m.author.id === message.author.id;
      
      await message.reply("👤 **Iniciando Processo de Inelegibilidade de Jogador.**\nResponda as perguntas abaixo:");

      await message.channel.send("1️⃣ **Quem é o jogador?** (Mencione o usuário ou digite o Nick)");
      const respPlayer = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
      const jogador = respPlayer.first().content;

      await message.channel.send("2️⃣ **Qual a Equipe/Tag deste jogador?**");
      const respEquipe = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
      const equipe = respEquipe.first().content;

      await message.channel.send("3️⃣ **Qual o Nível/Elo atual dele?** (Ex: Premier 20k / GC 15)");
      const respElo = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
      const eloDetectado = respElo.first().content;

      await message.channel.send("4️⃣ **Motivo detalhado da remoção?**");
      const respMotivo = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 60000 });
      const motivo = respMotivo.first().content;

      const embedPlayer = new EmbedBuilder()
        .setAuthor({ name: "BSS | AUDITORIA DE ATLETAS", iconURL: logoBSS })
        .setTitle("⚠️ JOGADOR FORA DOS REQUISITOS TÉCNICOS")
        .setThumbnail(logoBSS)
        .setColor("#FF8C00") // Laranja para alerta de jogador individual
        .setDescription(
          `O atleta **${jogador}** foi identificado com estatísticas acima do teto permitido pela **Base Strike Series** e deve ser removido da inscrição da equipe.`
        )
        .addFields(
          { 
            name: "📊 TETO TÉCNICO PERMITIDO", 
            value: "```\n• PREMIER: 13.000 PTS\n• GAMERS CLUB: LEVEL 10\n• FACEIT: LEVEL 4\n```",
            inline: false 
          },
          { 
            name: "👤 DADOS DO ATLETA", 
            value: `• **Jogador:** ${jogador}\n• **Equipe:** ${equipe}\n• **Nível Detectado:** ${eloDetectado}`,
            inline: true 
          },
          { 
            name: "🛡️ APLICAÇÃO", 
            value: `• **Staff:** ${message.author}\n• **Data:** <t:${Math.floor(Date.now() / 1000)}:d>`,
            inline: true 
          },
          { 
            name: "📝 PARECER TÉCNICO", 
            value: `\`\`\`text\n${motivo}\n\`\`\``,
            inline: false 
          },
          { 
            name: "⚖️ PROVIDÊNCIAS", 
            value: "🔹 O jogador deve ser substituído imediatamente.\n🔹 Caso jogue, a equipe perderá os pontos da partida.\n🔹 A tag de Elegibilidade deve ser revogada manualmente.",
            inline: false 
          }
        )
        .setFooter({ text: "BSS Auditoria - Decisão Soberana da Staff" })
        .setTimestamp();

      const canal = client.channels.cache.get(canalDestinoId);
      if (canal) {
        await canal.send({ content: `👤 **ALERTA DE SMURF/LEVEL ALTO:** ${jogador}`, embeds: [embedPlayer] });
        message.channel.send("✅ **O laudo do jogador foi enviado ao canal da staff.**");
      }

    } catch (error) {
      console.error(error);
      message.reply("⚠️ Tempo esgotado ou erro no comando. Tente novamente.");
    }
  }
};