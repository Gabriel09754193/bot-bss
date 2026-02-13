const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "removerequipe",
  execute: async (message, args, client) => {
    // Apenas Administradores podem usar
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ Você não tem permissão de Administrador para usar este comando.");
    }

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canalDestinoId = "1471160378535710731"; // Canal solicitado
    const tagElegivelId = "1471161180524380293"; 

    const alvoRole = message.mentions.roles.first();
    const motivo = args.slice(1).join(" ") || "Não especificado pela diretoria.";

    if (!alvoRole) {
      return message.reply("⚠️ **Uso:** `.removerequipe @CargoDoTime [motivo]`");
    }

    try {
      await message.guild.members.fetch();
      const membrosComCargo = alvoRole.members;

      const embed = new EmbedBuilder()
        .setAuthor({ name: "BSS LIGA OFICIAL | DEPARTAMENTO TÉCNICO", iconURL: logoBSS })
        .setTitle("🚫 DESCLASSIFICAÇÃO POR EXCESSO DE REQUISITOS")
        .setColor("#FF4500") 
        .setThumbnail(logoBSS)
        .setDescription(`A organização **${alvoRole.name}** foi removida da liga por violar os limites técnicos permitidos.`)
        .addFields(
          { 
            name: "📌 LIMITES MÁXIMOS BSS", 
            value: `> **PREMIER:** 13K\n> **GC:** LEVEL 10\n> **FACEIT:** LEVEL 4`,
            inline: false 
          },
          { 
            name: "📝 INFRAÇÃO DETECTADA", 
            value: `\`\`\`text\n${motivo}\n\`\`\`` 
          },
          { 
            name: "⚖️ PENALIDADE", 
            value: `Remoção imediata da equipe e revogação da tag de **Elegibilidade** de todos os membros.` 
          }
        )
        .setFooter({ text: `Processado por: ${message.author.tag} | ${membrosComCargo.size} jogadores afetados.` })
        .setTimestamp();

      // Remove a tag de Elegível de todos os membros
      for (const [id, membro] of membrosComCargo) {
        await membro.roles.remove(tagElegivelId).catch(() => {});
      }

      const canal = client.channels.cache.get(canalDestinoId);
      if (canal) {
        await canal.send({ content: `⚠️ **NOTIFICAÇÃO TÉCNICA:** ${alvoRole}`, embeds: [embed] });
      }

      message.reply(`✅ Equipe **${alvoRole.name}** desclassificada. Aviso enviado em <#${canalDestinoId}>.`);
      message.delete().catch(() => {});

    } catch (error) {
      console.error(error);
      message.reply("❌ Erro ao processar a desclassificação.");
    }
  }
};