const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "equipe",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
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

    try {
      // Força o bot a carregar os membros se ainda não estiverem em cache
      await message.guild.members.fetch(); 
      const membrosComCargo = alvoRole.members;

      if (membrosComCargo.size === 0) {
        return message.reply(`⚠️ O cargo **${alvoRole.name}** não possui membros.`);
      }

      // Envia uma resposta imediata para você saber que o bot recebeu o comando
      const msgStatus = await message.reply(`⏳ Processando **${membrosComCargo.size}** membros...`);

      let canalAlvoId = acao === "liberada" ? canalLiberada : (acao === "afastada" ? canalAfastada : canalBanida);
      let cor = acao === "liberada" ? "#2ECC71" : (acao === "afastada" ? "#E67E22" : "#FF0000");

      // Loop de atualização de cargos
      for (const [id, membro] of membrosComCargo) {
        if (acao === "liberada") {
          await membro.roles.add(tagElegivelId).catch(() => {});
          await membro.roles.remove([tagAfastadoId, tagBanidoId]).catch(() => {});
        } else if (acao === "afastada") {
          await membro.roles.add(tagAfastadoId).catch(() => {});
          await membro.roles.remove([tagElegivelId, tagBanidoId]).catch(() => {});
        } else if (acao === "banida") {
          await membro.roles.add(tagBanidoId).catch(() => {});
          await membro.roles.remove([tagElegivelId, tagAfastadoId]).catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: "🛡️ BSS LIGA OFICIAL", iconURL: logoBSS })
        .setTitle(`📢 EQUIPE ${acao.toUpperCase()}`)
        .setColor(cor)
        .setThumbnail(logoBSS)
        .setDescription(`A organização **${alvoRole.name}** foi processada.\n\n**Justificativa:**\n\`\`\`text\n${motivo}\n\`\`\``)
        .setTimestamp();

      const canalDestino = client.channels.cache.get(canalAlvoId);
      if (canalDestino) await canalDestino.send({ embeds: [embed] });
      
      await msgStatus.edit(`✅ Sincronização concluída para **${membrosComCargo.size}** membros.`);

    } catch (error) {
      console.error(error);
      message.reply("❌ Ocorreu um erro interno. Verifique o console da Discloud.");
    }
  }
};