const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "removerequipe",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const canalDestinoId = "1471160378535710731"; 
    const tagElegivelId = "1471161180524380293"; 
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    const alvoRole = message.mentions.roles.first();
    const motivo = args.slice(1).join(" ") || "Excesso de requisitos técnicos.";

    if (!alvoRole) {
      return message.reply("⚠️ **Uso:** `.removerequipe @CargoDoTime [motivo]`").catch(() => {});
    }

    try {
      // 1. Busca membros sem forçar o timeout longo
      const membrosComCargo = alvoRole.members;

      if (membrosComCargo.size === 0) {
        return message.reply(`⚠️ O cargo **${alvoRole.name}** está vazio.`).catch(() => {});
      }

      // 2. Verificação de Hierarquia (Segurança para o bot não crashar)
      const botMember = message.guild.members.me;
      if (botMember.roles.highest.position <= alvoRole.position) {
        return message.reply("❌ **Erro:** O cargo do bot precisa estar ACIMA do cargo do time!").catch(() => {});
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: "BSS LIGA OFICIAL | DEPARTAMENTO TÉCNICO", iconURL: logoBSS })
        .setTitle("🚫 DESCLASSIFICAÇÃO POR REQUISITOS")
        .setColor("#FF4500")
        .setThumbnail(logoBSS)
        .addFields(
          { name: "📌 LIMITES MÁXIMOS BSS", value: `> **PREMIER:** 13K\n> **GC:** LEVEL 10\n> **FACEIT:** LEVEL 4` },
          { name: "📝 INFRAÇÃO DETECTADA", value: `\`\`\`text\n${motivo}\n\`\`\`` },
          { name: "⚖️ PENALIDADE", value: `Remoção da equipe e revogação da tag de **Elegibilidade**.` }
        )
        .setFooter({ text: `Processado por: ${message.author.tag} | ${membrosComCargo.size} jogadores.` })
        .setTimestamp();

      // 3. Remove a tag de Elegível (Processamento em massa)
      const promessas = membrosComCargo.map(membro => 
        membro.roles.remove(tagElegivelId).catch(err => console.log(`Erro em ${membro.user.tag}`))
      );
      await Promise.all(promessas);

      // 4. Envio para o canal de logs da Staff
      const canal = client.channels.cache.get(canalDestinoId);
      if (canal) {
        await canal.send({ content: `⚠️ **NOTIFICAÇÃO TÉCNICA:** ${alvoRole}`, embeds: [embed] });
      }

      // 5. Confirmação final segura (evita o erro de Unknown Message)
      message.channel.send(`✅ Processo concluído: **${alvoRole.name}** removida da liga.`).catch(() => {});
      
      // Deleta a mensagem de comando apenas se ela ainda existir
      setTimeout(() => {
        message.delete().catch(() => {});
      }, 1000);

    } catch (error) {
      console.error("Erro no comando removerequipe:", error);
    }
  }
};