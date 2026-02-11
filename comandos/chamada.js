const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "chamada",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canalAfkId = "1471255071067996263"; 

    const alvoRole = message.mentions.roles.first();
    const numeroChamada = args[1]; 
    const igl = message.mentions.members.first() || message.member;

    if (!alvoRole || !['1', '2', '3'].includes(numeroChamada)) {
      return message.reply("⚠️ **Uso:** `.chamada @Time [1, 2 ou 3] @IGL`");
    }

    let titulo = "";
    let descricao = "";
    let cor = "";
    let msgPV = "";

    if (numeroChamada === "1") {
      titulo = "📢 PRIMEIRA CHAMADA | INATIVIDADE";
      descricao = `A equipe **${alvoRole}** foi detectada como inativa. Compareça imediatamente.`;
      cor = "#3498DB";
      msgPV = `Sua equipe **${alvoRole.name}** recebeu a **1ª Chamada** por inatividade. Evite punições!`;
    } 
    else if (numeroChamada === "2") {
      titulo = "⚠️ SEGUNDA CHAMADA | RISCO DE REMOÇÃO";
      descricao = `Atenção **${alvoRole}**, vocês estão em **risco real de remoção** da liga oficial.`;
      cor = "#E67E22";
      msgPV = `🚨 **AVISO URGENTE:** Sua equipe **${alvoRole.name}** recebeu a **2ª Chamada**. Vocês correm risco de serem removidos da liga!`;
    } 
    else if (numeroChamada === "3") {
      titulo = "🚫 TERCEIRA CHAMADA | REMOÇÃO IMINENTE";
      descricao = `ÚLTIMO AVISO para **${alvoRole}**. A equipe será **removida da liga** por falta de comparecimento.`;
      cor = "#FF0000";
      msgPV = `🚫 **FINALIZADO:** Sua equipe **${alvoRole.name}** recebeu a **3ª Chamada**. O processo de remoção por inatividade foi iniciado.`;
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "SISTEMA DE PRESENÇA BSS", iconURL: logoBSS })
      .setTitle(titulo)
      .setColor(cor)
      .setDescription(descricao)
      .addFields(
        { name: "👤 IGL Responsável", value: `${igl}`, inline: true },
        { name: "📊 Status", value: `Chamada ${numeroChamada}/3`, inline: true }
      )
      .setTimestamp();

    // Envio para o canal de AFKs
    const canalAfk = client.channels.cache.get(canalAfkId);
    if (canalAfk) {
      await canalAfk.send({ content: `⚠️ ${alvoRole} | ${igl} - **CHAMADA ${numeroChamada}/3**`, embeds: [embed] });
    }

    // --- NOVA FUNÇÃO: ENVIO NO PV DO IGL ---
    try {
      await igl.send(`**[BSS LIGA OFICIAL]**\n${msgPV}\n\n*Veja mais detalhes no canal de Times AFK.*`);
    } catch (err) {
      console.log(`Não foi possível enviar PV para o IGL ${igl.user.tag} (DM fechada).`);
    }

    message.reply(`✅ Chamada ${numeroChamada}/3 realizada e IGL notificado no privado.`).then(msg => {
       setTimeout(() => msg.delete(), 5000); // Deleta a confirmação após 5 seg
    });
    
    message.delete().catch(() => {});
  }
};