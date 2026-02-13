const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "removerequipe",
  execute: async (message, args, client) => {
    // Apenas Administradores podem disparar o anúncio
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const canalDestinoId = "1471160378535710731"; // Canal de logs/avisos
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    const alvoRole = message.mentions.roles.first();
    const motivo = args.slice(1).join(" ") || "Violação dos limites técnicos estabelecidos.";

    if (!alvoRole) {
      return message.reply("⚠️ **Uso:** `.removerequipe @CargoDoTime [motivo detalhado]`").catch(() => {});
    }

    try {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "BSS LIGA OFICIAL | DEPARTAMENTO TÉCNICO", iconURL: logoBSS })
        .setTitle("🚫 NOTIFICAÇÃO DE DESCLASSIFICAÇÃO")
        .setColor("#FF4500") 
        .setThumbnail(logoBSS)
        .setDescription(`A organização **${alvoRole.name}** foi oficialmente desclassificada da competição.`)
        .addFields(
          { 
            name: "📌 LIMITES MÁXIMOS PERMITIDOS", 
            value: `> **PREMIER:** 13.000 pts\n> **GAMERS CLUB:** LEVEL 10\n> **FACEIT:** LEVEL 4`,
            inline: false 
          },
          { 
            name: "📝 DETALHES DA INFRAÇÃO", 
            value: `\`\`\`text\n${motivo}\n\`\`\`` 
          },
          { 
            name: "⚖️ STATUS DA EQUIPE", 
            value: `• **Vaga:** Revogada\n• **Jogadores:** Inelegíveis para esta edição\n• **Ação Staff:** Remoção manual de tags em andamento.` 
          }
        )
        .setFooter({ text: `Relatório emitido por: ${message.author.tag}` })
        .setTimestamp();

      const canal = client.channels.cache.get(canalDestinoId);
      if (canal) {
        await canal.send({ content: `⚠️ **ALERTA DE PUNIÇÃO:** ${alvoRole}`, embeds: [embed] });
        
        // Confirmação para quem digitou o comando
        message.channel.send(`✅ **Anúncio enviado!** Agora você já pode seguir com a remoção manual das tags da equipe **${alvoRole.name}**.`).catch(() => {});
      } else {
        message.reply("❌ Erro: Não consegui encontrar o canal de destino.").catch(() => {});
      }

      // Deleta o comando para limpar o chat
      setTimeout(() => {
        message.delete().catch(() => {});
      }, 500);

    } catch (error) {
      console.error("Erro ao enviar embed:", error);
      message.reply("❌ Ocorreu um erro ao tentar enviar o anúncio.");
    }
  }
};