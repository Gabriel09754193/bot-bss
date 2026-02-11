const { EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");

module.exports = {
  nome: "denunciar",
  execute: async (message, args, client) => {
    const categoriaId = "1463677292365611153"; // Categoria onde o chat privado será criado
    const canalStaffId = "1464661705417167064"; // NOVO ID: Chat Staff para receber as logs
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    // Apaga o comando original para manter o anonimato no chat público
    await message.delete().catch(() => {});

    try {
      // Cria o canal privado para a coleta de dados
      const canalPrivado = await message.guild.channels.create({
        name: `🛡️-denuncia-${message.author.username}`,
        type: ChannelType.GuildText,
        parent: categoriaId,
        permissionOverwrites: [
          { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // Esconde de todos
          { id: message.author.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }, // Mostra ao denunciante
        ],
      });

      await canalPrivado.send(`👋 **Olá ${message.author}!** Este é seu espaço seguro para denúncias.\nResponda as perguntas abaixo para prosseguirmos.`);

      const filter = m => m.author.id === message.author.id;
      const collector = canalPrivado.createMessageCollector({ filter, max: 3, time: 300000 }); // 5 minutos de prazo

      let passo = 0;
      let dados = { alvo: "", motivo: "", provas: "" };

      await canalPrivado.send("1️⃣ **Qual o nome do Jogador ou Time denunciado?**");

      collector.on('collect', async m => {
        passo++;
        if (passo === 1) {
          dados.alvo = m.content;
          await canalPrivado.send("2️⃣ **Descreva detalhadamente o motivo da denúncia:**");
        } else if (passo === 2) {
          dados.motivo = m.content;
          await canalPrivado.send("3️⃣ **Envie os links das provas (prints ou vídeos):**");
        } else if (passo === 3) {
          dados.provas = m.content;

          // Monta o Embed detalhado para a Staff
          const embedStaff = new EmbedBuilder()
            .setAuthor({ name: "🚨 NOVA DENÚNCIA BSS RECEBIDA", iconURL: logoBSS })
            .setColor("#FF0000") // Vermelho Alerta
            .setThumbnail(logoBSS)
            .addFields(
              { name: "👤 Alvo da Denúncia", value: `\`${dados.alvo}\``, inline: true },
              { name: "🆔 Protocolo", value: `#${Math.floor(Math.random() * 9000) + 1000}`, inline: true },
              { name: "📝 Relato do Ocorrido", value: `\`\`\`text\n${dados.motivo}\n\`\`\`` },
              { name: "🔗 Evidências/Provas", value: dados.provas }
            )
            .setFooter({ text: "O denunciante permanece anônimo para os demais membros." })
            .setTimestamp();

          // Envia para o canal de logs da Staff atualizado
          const canalStaff = client.channels.cache.get(canalStaffId);
          if (canalStaff) {
            await canalStaff.send({ embeds: [embedStaff] });
          } else {
            console.error(`ERRO CRÍTICO: Canal Staff (${canalStaffId}) não encontrado!`);
          }

          await canalPrivado.send("✅ **Denúncia enviada com sucesso!** A Staff da BSS analisará o caso.\nEste canal será excluído em 10 segundos.");
          
          setTimeout(() => canalPrivado.delete(), 10000);
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size < 3) {
          canalPrivado.send("⚠️ **Tempo esgotado!** Por segurança, este canal será fechado. Inicie o processo novamente se necessário.");
          setTimeout(() => canalPrivado.delete(), 5000);
        }
      });

    } catch (error) {
      console.error("Erro ao criar canal de denúncia:", error);
      message.channel.send("❌ Ocorreu um erro ao iniciar sua denúncia. Verifique se o bot tem permissão de 'Gerenciar Canais'.")
        .then(msg => setTimeout(() => msg.delete(), 5000));
    }
  }
};