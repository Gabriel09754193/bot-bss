const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "ban",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("❌ Erro: Você não tem o cargo de Juiz para usar este comando.");
    }

    const usuario = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const motivo = args.slice(1).join(" ") || "Nenhum motivo especificado.";
    const canalLogId = "1470247857851338784"; 
    const canalLog = client.channels.cache.get(canalLogId);

    if (!usuario) return message.reply("⚠️ Mencione o infrator ou insira o ID.");
    if (!usuario.bannable) return message.reply("❌ Erro: Não posso banir este usuário.");

    const embedBan = new EmbedBuilder()
      .setAuthor({ name: "⚖️ TRIBUNAL DE JUSTIÇA BSS", iconURL: client.user.displayAvatarURL() })
      .setColor("#FF0000")
      .setThumbnail(usuario.user.displayAvatarURL({ dynamic: true }))
      .setTitle("🔨 SENTENÇA EXECUTADA: BANIMENTO")
      .setDescription("### ⚠️ AVISO IMPORTANTE\n> **Não quebre as regras da BSS!** Nosso sistema de integridade é rigoroso e focado na melhor experiência para todos os jogadores. O respeito às normas é obrigatório.")
      .addFields(
        { name: "👤 Usuário Banido", value: `**${usuario.user.tag}**\n\`ID: ${usuario.id}\``, inline: true },
        { name: "👮 Responsável", value: `\`\`\`yaml\n${message.author.tag}\n\`\`\``, inline: true }, // Destacado em bloco yaml
        { name: "📝 Motivo da Punição", value: `\`\`\`fix\n${motivo}\n\`\`\``, inline: false }
      )
      .setImage("https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMngxZ3F5Z3F5Z3F5Z3F5Z3F5Z3F5Z3F5Z3F5Z3F5Z3F5JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/qPD4yWyc6QreU/giphy.gif")
      .setTimestamp()
      .setFooter({ text: "Justiça BSS • Monitoramento 24h na Discloud" });

    try {
      await usuario.ban({ reason: motivo });
      
      if (canalLog) {
        await canalLog.send({ embeds: [embedBan] });
      }

      await message.reply(`✅ O martelo foi batido! O log foi enviado para <#${canalLogId}>.`);
      
      console.log(`🔨 Banimento aplicado com sucesso por ${message.author.tag}`);

    } catch (error) {
      console.error(error);
      message.reply("❌ Houve um erro ao tentar executar o banimento.");
    }
  },
};
