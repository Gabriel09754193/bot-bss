const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "demo",
  execute: async (message, args, client) => {
    // Verificação de Admin
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas a organização BSS pode postar demos.");
    }

    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canalDemoId = "1470940863608782858"; 
    const canalDemo = client.channels.cache.get(canalDemoId);

    if (!canalDemo) return message.reply("❌ Erve erro ao localizar o canal de demos.");

    const filter = m => m.author.id === message.author.id;
    
    try {
      // Perguntas interativas
      await message.reply("💾 **Iniciando Postagem de Demo**\nQuais times se enfrentaram?");
      const r1 = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const times = r1.first().content;

      await message.reply("🗺️ Qual foi o **Mapa**?");
      const r2 = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const mapa = r2.first().content;

      await message.reply("🔗 Cole o **Link para Download** da Demo:");
      const r3 = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const link = r3.first().content;

      // Criando o Embed com o logo da BSS
      const embedDemo = new EmbedBuilder()
        .setAuthor({ name: "BSS LIGA • SISTEMA DE DEMOS", iconURL: logoBSS })
        .setTitle("📀 ARQUIVO DE PARTIDA LIBERADO")
        .setColor("#00FFFF") 
        .setThumbnail(logoBSS) // O logo que você mandou ficará aqui no canto!
        .addFields(
          { name: "⚔️ Confronto", value: `**${times}**`, inline: true },
          { name: "🗺️ Mapa", value: `\`${mapa}\``, inline: true },
          { name: "👮 Organizador", value: `${message.author.username}`, inline: true },
          { name: "📥 Download", value: `[CLIQUE AQUI PARA BAIXAR](${link})` }
        )
        .setDescription("🚨 **Aviso aos Capitães:** Vocês têm o prazo regulamentar para revisar este arquivo e reportar qualquer suspeita à diretoria.")
        .setTimestamp()
        .setFooter({ text: "BSS Bot • Integridade e Transparência", iconURL: logoBSS });

      // Envia no canal oficial de demos
      await canalDemo.send({ embeds: [embedDemo] });
      
      await message.reply(`✅ Demo postada com sucesso em <#${canalDemoId}>!`);
      
      console.log(`💾 Demo BSS registrada por ${message.author.tag}`);

    } catch (err) {
      message.reply("⚠️ O tempo expirou. Inicie o comando novamente.");
    }
  },
};
