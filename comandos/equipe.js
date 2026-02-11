const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "equipe",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    
    // IDs dos Canais de Anúncio Específicos
    const canalLiberada = "1471171334380982495";
    const canalAfastada = "1471170999109157016";
    const canalBanida = "1471171178868506777";
    
    // IDs das Tags de Status
    const tagElegivelId = "1471161180524380293"; 
    const tagAfastadoId = "1471160904598163466"; 
    const tagBanidoId = "1471169188650553679";   

    const alvoRole = message.mentions.roles.first();
    const acao = args[1]?.toLowerCase(); 
    const motivo = args.slice(2).join(" ") || "Decisão da Diretoria BSS.";

    if (!alvoRole || !['liberada', 'afastada', 'banida'].includes(acao)) {
      return message.reply("⚠️ **Uso:** `.equipe @CargoDoTime [liberada/afastada/banida] [motivo]`");
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "🛡️ BSS LIGA OFICIAL | GESTÃO TÉCNICA", iconURL: logoBSS })
      .setThumbnail(logoBSS)
      .setTimestamp()
      .setFooter({ text: "Sincronização de Tags em Massa" });

    const membrosTime = alvoRole.members;
    let canalAlvoId = "";

    // --- LÓGICA: EQUIPE LIBERADA ---
    if (acao === "liberada") {
      canalAlvoId = canalLiberada;
      embed.setColor("#2ECC71").setTitle("✅ EQUIPE LIBERADA")
           .setDescription(`A organização **${alvoRole.name}** foi validada. Todos os membros receberam o selo de **Elegível**.`);

      membrosTime.forEach(membro => {
        membro.roles.add(tagElegivelId).catch(() => {});
        membro.roles.remove([tagAfastadoId, tagBanidoId]).catch(() => {});
      });
    } 

    // --- LÓGICA: EQUIPE AFASTADA ---
    else if (acao === "afastada") {
      canalAlvoId = canalAfastada;
      embed.setColor("#E67E22").setTitle("⚠️ EQUIPE AFASTADA")
           .setDescription(`A organização **${alvoRole.name}** está sob suspensão. Todos os membros foram marcados como **Afastados**.`);

      membrosTime.forEach(membro => {
        membro.roles.add(tagAfastadoId).catch(() => {});
        membro.roles.remove([tagElegivelId, tagBanidoId]).catch(() => {});
      });
    }

    // --- LÓGICA: EQUIPE BANIDA ---
    else if (acao === "banida") {
      canalAlvoId = canalBanida;
      embed.setColor("#FF0000").setTitle("🚫 EQUIPE BANIDA")
           .setDescription(`A organização **${alvoRole.name}** foi expulsa. Todos os membros vinculados receberam a tag de **Banido**.`);

      membrosTime.forEach(membro => {
        membro.roles.add(tagBanidoId).catch(() => {});
        membro.roles.remove([tagElegivelId, tagAfastadoId]).catch(() => {});
      });
    }

    embed.addFields({ name: "📄 Justificativa", value: `\`\`\`text\n${motivo}\n\`\`\`` });

    const canalDestino = client.channels.cache.get(canalAlvoId);
    if (canalDestino) await canalDestino.send({ embeds: [embed] });
    
    message.reply(`✅ Sucesso! O anúncio foi enviado para o canal de equipes **${acao}s**.`);
  }
};