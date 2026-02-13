const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "removerequipe",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const canalDestinoId = "1471160378535710731"; 
    const tagElegivelId = "1471161180524380293"; 
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    const alvoRole = message.mentions.roles.first();
    const motivo = args.slice(1).join(" ") || "Excesso de requisitos técnicos (Premier 13k/GC 10/Faceit 4).";

    if (!alvoRole) {
      return message.reply("⚠️ **Uso:** `.removerequipe @CargoDoTime [motivo]`").catch(() => {});
    }

    try {
      // FORÇA A ATUALIZAÇÃO DOS MEMBROS DO CARGO (Resolve o erro de "cargo vazio")
      await message.guild.members.fetch(); 
      const membrosComCargo = alvoRole.members;

      if (membrosComCargo.size === 0) {
        return message.reply(`⚠️ O bot ainda vê o cargo **${alvoRole.name}** como vazio. Tente adicionar o cargo a alguém e aguarde 5 segundos.`).catch(() => {});
      }

      // Verificação de Hierarquia
      const botMember = message.guild.members.me;
      if (botMember.roles.highest.position <= alvoRole.position) {
        return message.reply("❌ **Erro de Hierarquia:** O meu cargo (BSS BOT) precisa estar acima do cargo do time na lista de cargos!").catch(() => {});
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

      // Remove a tag de Elegível de todos os membros encontrados
      for (const [id, membro] of membrosComCargo) {
        await membro.roles.remove(tagElegivelId).catch(() => {});
      }

      const canal = client.channels.cache.get(canalDestinoId);
      if (canal) {
        await canal.send({ content: `⚠️ **EQUIPE REMOVIDA:** ${alvoRole}`, embeds: [embed] });
      }

      message.channel.send(`✅ A equipe **${alvoRole.name}** foi processada e removida.`);
      
      setTimeout(() => {
        message.delete().catch(() => {});
      }, 1000);

    } catch (error) {
      console.error(error);
      message.reply("❌ Erro ao sincronizar membros. Tente novamente em instantes.");
    }
  }
};