const { EmbedBuilder, PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  nome: "denunciar",
  execute: async (message, args, client) => {
    const categoriaId = "1463677292365611153"; // Categoria de Denúncias
    const canalStaffId = "1471161577087438910"; // Logs da Staff
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    // Apaga o comando original para manter sigilo
    await message.delete().catch(() => {});

    // Cria o canal privado dentro da categoria
    const canalPrivado = await message.guild.channels.create({
      name: `denuncia-${message.author.username}`,
      type: ChannelType.GuildText,
      parent: categoriaId,
      permissionOverwrites: [
        { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // Esconde de todos
        { id: message.author.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }, // Mostra ao denunciante
      ],
    });

    await canalPrivado.send(`🛡️ **Olá ${message.author}!** Este é seu canal privado para denúncia.\nResponda às perguntas abaixo:`);

    const filter = m => m.author.id === message.author.id;
    const collector = canalPrivado.createMessageCollector({ filter, max: 3, time: 300000 }); // 5 minutos

    let passo = 0;
    let dados = { alvo: "", motivo: "", provas: "" };

    await canalPrivado.send("1️⃣ **Qual o nome do Jogador ou Time?**");

    collector.on('collect', async m => {
      passo++;
      if (passo === 1) {
        dados.alvo = m.content;
        await canalPrivado.send("2️⃣ **Qual o motivo da denúncia?**");
      } else if (passo === 2) {
        dados.motivo = m.content;
        await canalPrivado.send("3️⃣ **Envie os links das provas (prints/vídeos):**");
      } else if (passo === 3) {
        dados.provas = m.content;

        // Envia para as LOGS ADMIN
        const embedStaff = new EmbedBuilder()
          .setAuthor({ name: "🚨 NOVA DENÚNCIA BSS", iconURL: logoBSS })
          .setColor("#FF0000")
          .setThumbnail(logoBSS)
          .addFields(
            { name: "👤 Alvo", value: `\`${dados.alvo}\``, inline: true },
            { name: "🆔 Caso", value: `#${Math.floor(Math.random() * 9000) + 1000}`, inline: true },
            { name: "📝 Relato", value: `\`\`\`text\n${dados.motivo}\n\`\`\`` },
            { name: "🔗 Provas", value: dados.provas }
          )
          .setFooter({ text: "Sistema de Proteção BSS" })
          .setTimestamp();

        const canalStaff = client.channels.cache.get(canalStaffId);
        if (canalStaff) {
          await canalStaff.send({ embeds: [embedStaff] });
        } else {
          console.log("ERRO: Canal de logs não encontrado! Verifique o ID 1471161577087438910");
        }

        await canalPrivado.send("✅ **Denúncia enviada!** Este canal será excluído em 10 segundos.");
        
        setTimeout(() => canalPrivado.delete(), 10000);
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time' && collected.size < 3) {
        canalPrivado.send("⚠️ Tempo esgotado! Este canal será fechado.");
        setTimeout(() => canalPrivado.delete(), 5000);
      }
    });
  }
};
