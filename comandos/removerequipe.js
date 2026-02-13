const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "removerequipe",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canalDestinoId = "1471160378535710731";

    try {
      const filtro = m => m.author.id === message.author.id;
      
      // Sequência de perguntas para o Admin
      await message.reply("📝 **Iniciando Relatório de Desclassificação.**\nResponda as perguntas abaixo:");

      await message.channel.send("1️⃣ **Qual o nome da equipe?** (Marque o cargo ou digite o nome)");
      const respEquipe = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
      const equipe = respEquipe.first().content;

      await message.channel.send("2️⃣ **Quem é o IGL da equipe?** (Mencione o usuário)");
      const respIgl = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
      const igl = respIgl.first().content;

      await message.channel.send("3️⃣ **Qual o motivo detalhado da punição?**");
      const respMotivo = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 60000 });
      const motivo = respMotivo.first().content;

      // Montagem do Embed Ultra Detalhado
      const embedPunicão = new EmbedBuilder()
        .setAuthor({ name: "BASE STRIKE SERIES | DEPARTAMENTO TÉCNICO", iconURL: logoBSS })
        .setTitle("🚫 LAUDO OFICIAL DE DESCLASSIFICAÇÃO")
        .setThumbnail(logoBSS)
        .setColor("#B22222")
        .setDescription(
          `A organização **${equipe}** foi submetida a uma revisão técnica e está oficialmente desclassificada da liga por violar os requisitos de integridade competitiva.`
        )
        .addFields(
          { 
            name: "📊 LIMITES TÉCNICOS DA LIGA", 
            value: "> **PREMIER:** MÁXIMO 13.000 PTS\n> **GAMERS CLUB:** LEVEL 10\n> **FACEIT:** LEVEL 4",
            inline: false 
          },
          { 
            name: "📁 DADOS DA OCORRÊNCIA", 
            value: `• **Equipe:** ${equipe}\n• **Responsável (IGL):** ${igl}\n• **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: false 
          },
          { 
            name: "📝 PARECER DA AUDITORIA", 
            value: `\`\`\`text\n${motivo}\n\`\`\``,
            inline: false 
          },
          { 
            name: "⚖️ PENALIDADES APLICADAS", 
            value: "• Exclusão imediata da tabela oficial.\n• Perda de pontos e premiações.\n• Revogação de elegibilidade de todos os membros vinculados.",
            inline: false 
          }
        )
        .setFooter({ text: `Punição aplicada por: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      const canal = client.channels.cache.get(canalDestinoId);
      if (canal) {
        await canal.send({ content: `🚨 **NOTIFICAÇÃO CRÍTICA:** ${equipe}`, embeds: [embedPunicão] });
        message.channel.send("✅ **O laudo técnico foi gerado e enviado para o canal da staff.**");
      }

    } catch (error) {
      console.error(error);
      message.reply("⚠️ O tempo de resposta expirou ou ocorreu um erro. Tente o comando novamente.");
    }
  }
};