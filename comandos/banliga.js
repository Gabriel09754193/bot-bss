const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "banliga",
  execute: async (message, args, client) => {
    // Apenas Administradores
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Você não tem permissão para gerenciar punições.");
    }

    const canalBlacklistId = "1470241583847706694";
    const canalBlacklist = client.channels.cache.get(canalBlacklistId);

    if (!canalBlacklist) {
      return message.reply("❌ Não consegui encontrar o canal da Blacklist. Verifique se o ID está correto.");
    }

    const filter = m => m.author.id === message.author.id;
    
    try {
      // Pergunta 1: Time/Jogador
      await message.reply("🚫 **Iniciando Registro de Punição**\nQual o nome da equipe ou jogador punido?");
      const coletor1 = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const alvo = coletor1.first().content;

      // Pergunta 2: Punição
      await message.reply("⚖️ Qual a punição aplicada? (Ex: Banimento Permanente, Perda de 3 pontos, Suspensão por 2 jogos)");
      const coletor2 = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const punicao = coletor2.first().content;

      // Pergunta 3: Motivo e Provas
      await message.reply("📝 Qual o motivo detalhado e o link da prova (se houver)?");
      const coletor3 = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const motivo = coletor3.first().content;

      const embedPunicão = new EmbedBuilder()
        .setTitle("📢 REGISTRO DE INFRAÇÃO - BSS LIGA")
        .setColor("#B22222") // Vermelho Escuro
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1022/1022334.png")
        .addFields(
          { name: "🛡️ Equipe/Jogador", value: `**${alvo}**`, inline: true },
          { name: "⚖️ Punição", value: `**${punicao}**`, inline: true },
          { name: "👮 Admin Responsável", value: `${message.author.username}`, inline: true },
          { name: "📝 Detalhes e Provas", value: `\`\`\`${motivo}\`\`\`` }
        )
        .setTimestamp()
        .setFooter({ text: "Registro Oficial • BSS Bot System" });

      // Envia no canal da Blacklist
      await canalBlacklist.send({ embeds: [embedPunicão] });
      
      await message.reply(`✅ Punição registrada com sucesso no canal <#${canalBlacklistId}>!`);
      
      console.log(`🚫 Punição registrada por ${message.author.tag} contra ${alvo}`);

    } catch (err) {
      message.reply("⚠️ O tempo para responder acabou ou ocorreu um erro. Tente novamente.");
    }
  },
};
