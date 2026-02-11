const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "equipe",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    
    // IDs dos Canais e Tags
    const canalLiberada = "1471171334380982495";
    const canalAfastada = "1471170999109157016";
    const canalBanida = "1471171178868506777";
    const tagElegivelId = "1471161180524380293"; 
    const tagAfastadoId = "1471160904598163466"; 
    const tagBanidoId = "1471169188650553679";   

    const alvoRole = message.mentions.roles.first();
    const acao = args[1]?.toLowerCase(); 
    const motivo = args.slice(2).join(" ") || "Decisão da Diretoria BSS.";

    if (!alvoRole || !['liberada', 'afastada', 'banida'].includes(acao)) {
      return message.reply("⚠️ **Uso:** `.equipe @CargoDoTime [liberada/afastada/banida] [motivo]`");
    }

    // --- CORREÇÃO AQUI: BUSCANDO MEMBROS DO CARGO ---
    // Força o Discord a mandar a lista completa de quem tem o cargo
    await message.guild.members.fetch(); 
    const membrosComCargo = alvoRole.members;

    if (membrosComCargo.size === 0) {
        return message.reply(`⚠️ Não encontrei nenhum membro com o cargo **${alvoRole.name}**.`);
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "🛡️ BSS LIGA OFICIAL", iconURL: logoBSS })
      .setThumbnail(logoBSS)
      .setTimestamp()
      .setFooter({ text: `Processando ${membrosComCargo.size} membros.` });

    let canalAlvoId = "";

    // Lógica de Tags (Loop corrigido)
    membrosComCargo.forEach(async (membro) => {
      try {
        if (acao === "liberada") {
          await membro.roles.add(tagElegivelId);
          await membro.roles.remove([tagAfastadoId, tagBanidoId]);
          canalAlvoId = canalLiberada;
        } else if (acao === "afastada") {
          await membro.roles.add(tagAfastadoId);
          await membro.roles.remove([tagElegivelId, tagBanidoId]);
          canalAlvoId = canalAfastada;
        } else if (acao === "banida") {
          await membro.roles.add(tagBanidoId);
          await membro.roles.remove([tagElegivelId, tagAfastadoId]);
          canalAlvoId = canalBanida;
        }
      } catch (e) {
        console.error(`Erro ao atualizar membro ${membro.user.tag}`);
      }
    });

    embed.setTitle(`📢 EQUIPE ${acao.toUpperCase()}`)
         .setDescription(`A organização **${alvoRole.name}** foi processada com sucesso.`)
         .addFields({ name: "📄 Justificativa", value: `\`\`\`text\n${motivo}\n\`\`\`` });

    if (acao === "liberada") embed.setColor("#2ECC71");
    else if (acao === "afastada") embed.setColor("#E67E22");
    else if (acao === "banida") embed.setColor("#FF0000");

    const canalDestino = client.channels.cache.get(canalAlvoId);
    if (canalDestino) await canalDestino.send({ embeds: [embed] });
    
    message.reply(`✅ Sincronização concluída! **${membrosComCargo.size}** jogadores atualizados.`);
  }
};