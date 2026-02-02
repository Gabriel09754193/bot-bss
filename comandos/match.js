const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

/* =========================
   CONFIGURAÇÕES FIXAS (BSS)
========================= */
const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
};

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    // Agora qualquer um pode usar o comando, mas você pode restringir se quiser
    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Disponibilidade da equipe?**"];
    let respostas = [];
    let msgsColeta = [];

    const msgBoasVindas = await message.channel.send("✨ **BSS Match System** | Iniciando formulário...");
    msgsColeta.push(msgBoasVindas);

    const coletor = message.channel.createMessageCollector({ 
        filter: (m) => m.author.id === message.author.id, 
        max: 2, 
        time: 60000 
    });

    const p1 = await message.channel.send(perguntas[0]);
    msgsColeta.push(p1);

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      msgsColeta.push(m);
      if (respostas.length < 2) {
        const p2 = await message.channel.send(perguntas[1]);
        msgsColeta.push(p2);
      }
    });

    coletor.on("end", async () => {
      msgsColeta.forEach(m => m.delete().catch(() => {}));
      if (respostas.length < 2) return;

      const [nomeA, disp] = respostas;
      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      // ESTE EMBED É A BASE DE TUDO. OS IDS DOS FIELDS SÃO USADOS NO INDEX.
      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 NOVO DESAFIO DISPONÍVEL")
        .setThumbnail("https://i.imgur.com/8E9X9ZQ.png")
        .addFields(
          { name: "🛡️ Equipe Solicitante", value: `**${nomeA}**`, inline: true },
          { name: "🎮 IGL Responsável", value: `<@${message.author.id}>`, inline: true },
          { name: "📅 Disponibilidade", value: `\`${disp}\`` }
        )
        .setFooter({ text: "Clique no botão abaixo para aceitar o confronto!" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("bss_match_aceitar") // ID que o index está escutando
          .setLabel("ACEITAR DESAFIO")
          .setStyle(ButtonStyle.Success)
          .setEmoji("⚔️")
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
};
