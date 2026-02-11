const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "equipe",
  execute: async (message, args, client) => {
    // Verificação de permissão administrativa
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canalAnunciosId = "1471160378535710731"; // Canal de anúncios
    
    // IDs das Tags de Status
    const tagElegivelId = "1471161180524380293"; // Tag para Liberados
    const tagAfastadoId = "1471160904598163466"; // Tag para Afastados (Em Análise)
    const tagBanidoId = "1471169188650553679";   // Tag para Banidos

    const alvoRole = message.mentions.roles.first();
    const acao = args[1]?.toLowerCase(); 
    const motivo = args.slice(2).join(" ") || "Critério da diretoria técnica BSS.";

    if (!alvoRole || !['liberada', 'afastada', 'banida'].includes(acao)) {
      return message.reply("⚠️ **Uso:** `.equipe @CargoDoTime [liberada/afastada/banida] [motivo]`");
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "🛡️ BSS LIGA OFICIAL | GESTÃO TÉCNICA", iconURL: logoBSS })
      .setThumbnail(logoBSS)
      .setTimestamp()
      .setFooter({ text: "Processamento de Tags em Massa • BSS" });

    const membrosTime = alvoRole.members;

    // --- LÓGICA: EQUIPE LIBERADA ---
    if (acao === "liberada") {
      embed.setColor("#2ECC71").setTitle("✅ EQUIPE LIBERADA")
           .setDescription(`A organização **${alvoRole.name}** foi validada. Todos os membros receberam o selo de Elegível.`);

      membrosTime.forEach(membro => {
        membro.roles.add(tagElegivelId).catch(() => {});
        membro.roles.remove([tagAfastadoId, tagBanidoId]).catch(() => {});
      });
    } 

    // --- LÓGICA: EQUIPE AFASTADA ---
    else if (acao === "afastada") {
      embed.setColor("#E67E22").setTitle("⚠️ EQUIPE AFASTADA")
           .setDescription(`A organização **${alvoRole.name}** está sob suspensão. Todos os membros foram marcados para análise.`);

      membrosTime.forEach(membro => {
        membro.roles.add(tagAfastadoId).catch(() => {});
        membro.roles.remove([tagElegivelId, tagBanidoId]).catch(() => {});
      });
    }

    // --- LÓGICA: EQUIPE BANIDA ---
    else if (acao === "banida") {
      embed.setColor("#FF0000").setTitle("🚫 EQUIPE BANIDA")
           .setDescription(`A organização **${alvoRole.name}** foi banida. Todos os membros vinculados receberam a tag de restrição.`);

      membrosTime.forEach(membro => {
        membro.roles.add(tagBanidoId).catch(() => {});
        membro.roles.remove([tagElegivelId, tagAfastadoId]).catch(() => {});
      });
    }

    embed.addFields({ name: "📄 Justificativa", value: `\`\`\`text\n${motivo}\n\`\`\`` });

    const canal = client.channels.cache.get(canalAnunciosId);
    if (canal) await canal.send({ embeds: [embed] });
    
    message.reply(`✅ Sincronização de cargos concluída para **${membrosTime.size}** membros do time **${alvoRole.name}**.`);
  }
};