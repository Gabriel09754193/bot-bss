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
      return message.reply("⚠️ **Uso:** `.chamada @Time [1, 2 ou 3] @IGL`").catch(() => {});
    }

    let titulo, descricao, cor, msgPV;

    if (numeroChamada === "1") {
      titulo = "📢 PRIMEIRA CHAMADA | INATIVIDADE";
      descricao = `A equipe **${alvoRole}** foi detectada como inativa. Compareça imediatamente.`;
      cor = "#3498DB";
      msgPV = `Sua equipe **${alvoRole.name}** recebeu a **1ª Chamada** por inatividade.`;
    } else if (numeroChamada === "2") {
      titulo = "⚠️ SEGUNDA CHAMADA | RISCO DE REMOÇÃO";
      descricao = `Atenção **${alvoRole}**, vocês estão em **risco real de remoção** da liga oficial.`;
      cor = "#E67E22";
      msgPV = `🚨 **AVISO URGENTE:** Sua equipe **${alvoRole.name}** recebeu a **2ª Chamada**.`;
    } else {
      titulo = "🚫 TERCEIRA CHAMADA | REMOÇÃO IMINENTE";
      descricao = `ÚLTIMO AVISO para **${alvoRole}**. A equipe será **removida da liga** por falta de comparecimento.`;
      cor = "#FF0000";
      msgPV = `🚫 **FINALIZADO:** Sua equipe **${alvoRole.name}** recebeu a **3ª Chamada**.`;
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "SISTEMA DE PRESENÇA BSS", iconURL: logoBSS })
      .setTitle(titulo).setColor(cor).setDescription(descricao)
      .addFields({ name: "👤 IGL Responsável", value: `${igl}`, inline: true }, { name: "📊 Status", value: `Chamada ${numeroChamada}/3`, inline: true })
      .setTimestamp();

    try {
      // 1. Deleta a mensagem de comando primeiro
      await message.delete().catch(() => {});

      // 2. Envia para o canal de AFKs
      const canalAfk = client.channels.cache.get(canalAfkId);
      if (canalAfk) {
        await canalAfk.send({ content: `⚠️ ${alvoRole} | ${igl} - **CHAMADA ${numeroChamada}/3**`, embeds: [embed] });
      }

      // 3. Notifica o IGL no privado
      await igl.send(`**[BSS LIGA OFICIAL]**\n${msgPV}`).catch(() => console.log("DM fechada"));

      // 4. Envia confirmação simples no chat atual sem dar reply (evita o crash)
      const confirmacao = await message.channel.send(`✅ Chamada **${numeroChamada}/3** enviada para ${alvoRole.name}.`);
      setTimeout(() => confirmacao.delete().catch(() => {}), 5000);

    } catch (error) {
      console.error("Erro no comando chamada:", error);
    }
  }
};