const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "denunciar",
  execute: async (message, args, client) => {
    const canalStaffId = "1471161577087438910";
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    // Apaga o comando imediatamente para manter o anonimato
    await message.delete().catch(() => {});

    // Envia uma mensagem temporária avisando que começou
    const aviso = await message.channel.send(`🛡️ **${message.author}**, verifique suas mensagens ou responda aqui rapidamente. (Sua mensagem será apagada)`);
    
    const filter = m => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, max: 3, time: 60000 });

    let passo = 0;
    let dados = { alvo: "", motivo: "", provas: "" };

    message.channel.send("1️⃣ **Qual o nome do Jogador ou Time?**").then(m => setTimeout(() => m.delete(), 15000));

    collector.on('collect', async m => {
      await m.delete().catch(() => {}); // Apaga a resposta do usuário na hora!
      
      passo++;
      if (passo === 1) {
        dados.alvo = m.content;
        message.channel.send("2️⃣ **Qual o motivo da denúncia?**").then(msg => setTimeout(() => msg.delete(), 15000));
      } else if (passo === 2) {
        dados.motivo = m.content;
        message.channel.send("3️⃣ **Envie os links das provas (prints/vídeos):**").then(msg => setTimeout(() => msg.delete(), 15000));
      } else if (passo === 3) {
        dados.provas = m.content;
        
        // Envia para a Staff
        const embedStaff = new EmbedBuilder()
          .setAuthor({ name: "🚨 NOVA DENÚNCIA BSS", iconURL: logoBSS })
          .setColor("#FF0000")
          .setThumbnail(logoBSS)
          .addFields(
            { name: "👤 Alvo", value: `\`${dados.alvo}\``, inline: true },
            { name: "🆔 Protocolo", value: `#${Math.floor(Math.random() * 9000)}`, inline: true },
            { name: "📝 Motivo", value: dados.motivo },
            { name: "🔗 Provas", value: dados.provas }
          )
          .setFooter({ text: "Denunciante Protegido pelo Sistema BSS" })
          .setTimestamp();

        const canalStaff = client.channels.cache.get(canalStaffId);
        if (canalStaff) await canalStaff.send({ embeds: [embedStaff] });

        message.channel.send("✅ **Denúncia enviada com sucesso e apagada do chat!**").then(msg => setTimeout(() => msg.delete(), 5000));
        aviso.delete().catch(() => {});
      }
    });

    collector.on('end', collected => {
      if (collected.size < 3) {
        message.channel.send("⚠️ Tempo esgotado. Tente o comando novamente.").then(m => setTimeout(() => m.delete(), 5000));
      }
    });
  }
};
