const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField 
} = require("discord.js");

module.exports = {
  nome: "match",
  async execute(message, args, client) {
    // IDs de Configuração
    const ID_CARGO_IGL = "1463258074310508765";
    const ID_CANAL_ESPERA = "1463270089376927845";

    // Verifica se é Admin ou se possui o cargo de IGL
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
        !message.member.roles.cache.has(ID_CARGO_IGL)) {
      return message.reply("❌ Apenas IGLs autorizados ou Administradores podem iniciar um desafio.");
    }

    // Limpa a mensagem do comando
    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = [
        "🛡️ **Qual o nome da sua equipe?**",
        "📅 **Qual a disponibilidade de horários/data?**"
    ];
    let respostas = [];
    
    const prompt = await message.channel.send("✨ **BSS Match** | Iniciando coleta de dados...");

    const coletor = message.channel.createMessageCollector({ 
        filter: (m) => m.author.id === message.author.id, 
        max: 2,
        time: 60000 
    });

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      m.delete().catch(() => {});
      
      if (respostas.length === 1) {
          prompt.edit(perguntas[1]);
      }
    });

    coletor.on("end", async () => {
      prompt.delete().catch(() => {});
      
      if (respostas.length < 2) {
          return message.channel.send("⚠️ **O tempo acabou ou os dados não foram preenchidos.**").then(msg => {
              setTimeout(() => msg.delete().catch(() => {}), 5000);
          });
      }

      const [nomeEquipe, disponibilidade] = respostas;
      
      try {
          const canalEspera = await client.channels.fetch(ID_CANAL_ESPERA);

          const embedDesafio = new EmbedBuilder()
            .setColor("#FF8C00")
            .setTitle("🔥 NOVO DESAFIO DISPONÍVEL")
            .addFields(
              { name: "🛡️ Equipe Desafiante", value: `**${nomeEquipe}**`, inline: true },
              { name: "👑 IGL Responsável", value: `${message.author}`, inline: true },
              { name: "📅 Disponibilidade", value: `\`${disponibilidade}\`` }
            )
            .setFooter({ text: `${message.author.id}` }) // ID usado pelo index para o aceite
            .setTimestamp();

          const botaoAceitar = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("bss_accept_match") // ID exato que o index.js reconhece
                .setLabel("ACEITAR DESAFIO")
                .setStyle(ButtonStyle.Success)
                .setEmoji("⚔️")
          );

          await canalEspera.send({ embeds: [embedDesafio], components: [botaoAceitar] });
          
          // Confirmação privada para o IGL desafiante
          const confirm = await message.channel.send("✅ **Tudo pronto!** Seu desafio foi enviado para o canal de espera.");
          setTimeout(() => confirm.delete().catch(() => {}), 5000);

      } catch (error) {
          console.error("Erro ao enviar desafio:", error);
          message.channel.send("❌ Erro ao enviar o desafio. Verifique o ID do canal de espera.");
      }
    });
  },
};
