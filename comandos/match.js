const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

/* =========================
   CONFIGURAÇÕES FIXAS (BSS)
========================= */
const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
  PICKBAN: "1464649761213780149",
  AMISTOSOS: "1466989903232499712",
  RESULTADOS: "1463260797604987014",
  CATEGORIA_MATCH: "1463562210591637605",
};

const MAP_POOL = [
  "Mirage",
  "Inferno",
  "Nuke",
  "Overpass",
  "Ancient",
  "Anubis",
  "Dust2",
];

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas **administradores** podem usar este comando.");
    }

    /* =========================
       ETAPA 1 — COLETA DE DADOS
    ========================= */
    const perguntas = [
      "🛡️ **Qual o nome da sua equipe?**",
      "📅 **Disponibilidade da equipe** (ex: Hoje 20h–22h / Amanhã após 18h):",
    ];

    let respostas = [];
    let etapa = 0;

    await message.reply({
      content:
        "⚔️ **BSS | Solicitação de Amistoso**\nFormato disponível: **MD3 (Melhor de 3)**\n\nResponda às perguntas abaixo:",
    });

    const coletor = message.channel.createMessageCollector({
      filter: (m) => m.author.id === message.author.id,
      max: perguntas.length,
      time: 120000,
    });

    await message.channel.send(perguntas[etapa]);

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      etapa++;

      if (etapa < perguntas.length) {
        await message.channel.send(perguntas[etapa]);
      }
    });

    coletor.on("end", async () => {
      if (respostas.length < perguntas.length) {
        return message.channel.send("❌ Tempo esgotado. Use `.match` novamente.");
      }

      const [nomeTimeA, disponibilidade] = respostas;
      const iglA = message.author;

      /* =========================
         ETAPA 2 — PARTIDAS EM ESPERA
      ========================= */
      const embedEspera = new EmbedBuilder()
        .setColor("#ff8c00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .addFields(
          { name: "🛡️ Time Solicitante", value: nomeTimeA, inline: true },
          { name: "🎮 IGL", value: `<@${iglA.id}>`, inline: true },
          { name: "📅 Disponibilidade", value: disponibilidade },
          {
            name: "⚠️ Aviso",
            value:
              "Aceite **apenas se sua equipe realmente for jogar**.\nFormato: **MD3**",
          }
        )
        .setFooter({ text: "BSS League • Amistosos" });

      const botaoAceitar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("bss_match_aceitar")
          .setLabel("Aceitar Match")
          .setStyle(ButtonStyle.Success)
      );

      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      const msgEspera = await canalEspera.send({
        embeds: [embedEspera],
        components: [botaoAceitar],
      });

      /* =========================
         ETAPA 3 — INTERAÇÃO ACEITAR
      ========================= */
      const coletorBotao = msgEspera.createMessageComponentCollector({
        time: 86400000,
      });

      coletorBotao.on("collect", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const iglB = interaction.user;

        /* =========================
           ETAPA 4 — CRIAR CHAT PRIVADO
        ========================= */
        const canalPrivado = await interaction.guild.channels.create({
          name: `match-${nomeTimeA.toLowerCase()}-vs-${iglB.username.toLowerCase()}`,
          type: ChannelType.GuildText,
          parent: IDS.CATEGORIA_MATCH,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: iglA.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            {
              id: iglB.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
          ],
        });

        /* =========================
           PEDIR NOME DO TIME B
        ========================= */
        await canalPrivado.send(
          `🛡️ <@${iglB.id}>, **qual o nome da sua equipe?**`
        );

        const coletorTimeB = canalPrivado.createMessageCollector({
          filter: (m) => m.author.id === iglB.id,
          max: 1,
          time: 60000,
        });

        coletorTimeB.on("collect", async (msgTimeB) => {
          const nomeTimeB = msgTimeB.content;

          /* =========================
             EMBED INICIAL DO MATCH
          ========================= */
          const embedPrivado = new EmbedBuilder()
            .setColor("#1e90ff")
            .setTitle("🤝 BSS | Chat Privado do Amistoso")
            .setDescription(
              "Este chat é destinado à **combinação de horário** entre as equipes e alinhamento com a **administração**.\n\n" +
              "⚠️ **O Pick/Ban só inicia quando um ADMIN clicar no botão abaixo.**"
            )
            .addFields(
              { name: "🛡️ Time A", value: nomeTimeA, inline: true },
              { name: "🛡️ Time B", value: nomeTimeB, inline: true },
              { name: "🎮 IGL Time A", value: `<@${iglA.id}>` },
              { name: "🎮 IGL Time B", value: `<@${iglB.id}>` },
              { name: "📋 Formato", value: "MD3 (Melhor de 3)" }
            )
            .setFooter({ text: "BSS League • Amistosos" });

          const botoesAdmin = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("bss_pickban_start")
              .setLabel("Iniciar Pick/Ban")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("bss_match_cancelar")
              .setLabel("Cancelar Match")
              .setStyle(ButtonStyle.Danger)
          );

          await canalPrivado.send({
            content: `<@${iglA.id}> <@${iglB.id}>`,
            embeds: [embedPrivado],
            components: [botoesAdmin],
          });

          await interaction.editReply({
            content: "✅ Match aceito e chat privado criado.",
          });
        });
      });
    });
  },
};
