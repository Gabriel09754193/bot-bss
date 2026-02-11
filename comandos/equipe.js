const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "equipe",
  execute: async (message, args, client) => {
    // Apenas Administradores BSS
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canalAnunciosId = "1471160378535710731";
    const cargoElegivelId = "1471161180524380293"; // Cargo de equipe liberada

    const alvo = message.mentions.roles.first() || message.mentions.members.first();
    const acao = args[1]?.toLowerCase(); // liberar ou afastar
    const motivo = args.slice(2).join(" ") || "Não especificado.";

    if (!alvo || !acao) {
      return message.reply("⚠️ **Uso:** `.equipe @time/player [liberar/afastar] [motivo]`");
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "🛡️ CONTROLE DE EQUIPES | BSS", iconURL: logoBSS })
      .setThumbnail(logoBSS)
      .setTimestamp();

    if (acao === "liberar") {
      // Adiciona o selo de elegível/liberado
      if (alvo.roles) await alvo.roles.add(cargoElegivelId).catch(() => {});
      
      embed.setColor("#2ECC71") // Verde
           .setTitle("✅ EQUIPE LIBERADA")
           .setDescription(`A equipe/membro **${alvo}** cumpriu os requisitos e está autorizada a disputar a Liga Oficial.`)
           .addFields({ name: "📝 Nota da Staff", value: motivo });
    } 
    else if (acao === "afastar") {
      // Remove o selo de elegível se houver
      if (alvo.roles) await alvo.roles.remove(cargoElegivelId).catch(() => {});
      
      embed.setColor("#FF0000") // Vermelho
           .setTitle("🚫 EQUIPE AFASTADA")
           .setDescription(`A equipe/membro **${alvo}** foi suspensa das atividades da Liga Oficial.`)
           .addFields({ name: "📝 Motivo do Afastamento", value: motivo });
    }

    const canal = client.channels.cache.get(canalAnunciosId);
    if (canal) await canal.send({ embeds: [embed] });
    
    message.reply(`✅ Ação **${acao}** executada com sucesso.`);
  }
};