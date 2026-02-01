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

/* =========================
   ESTADO DOS PICK/BANS
========================= */
const activePickBans = new Map();

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas **administradores** podem usar este comando.");
    }

    /* =========================
       ETAPA 1 — COLETA
    ========================= */
    const perguntas = [
      "🛡️ **Qual o nome da sua equipe?**",
      "📅 **Disponibilidade da equipe** (ex: Hoje 20h–22h / Amanhã após 18h):",
    ];

    let respostas = [];
    let etapa = 0;

    await message.reply(
      "⚔️ **BSS | Solicitação de Amistoso**\nFormato disponível: **MD3 (Melhor de 3)**"
    );

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
         PARTIDAS EM ESPERA
      ========================= */
      const embedEspera = new EmbedBuilder()
        .setColor("#ff8c00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .addFields(
          { name: "🛡️ Time Solicitante", value: nomeTimeA },
          { name: "🎮 IGL", value: `<@${iglA.id}>` },
          { name: "📅 Disponibilidade", value: disponibilidade },
          {
            name: "⚠️ Aviso",
            value: "Aceite apenas se for jogar • Formato **MD3**",
          }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("bss_match_aceitar")
          .setLabel("Aceitar Match")
          .setStyle(ButtonStyle.Success)
      );

      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      const msg = await canalEspera.send({
        embeds: [embedEspera],
        components: [row],
      });

      /* =========================
         ACEITAR MATCH
      ========================= */
      const coletorBotao = msg.createMessageComponentCollector();

      coletorBotao.on("collect", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const iglB = interaction.user;

        /* =========================
           CRIAR CHAT PRIVADO
        ========================= */
        const canalPrivado = await interaction.guild.channels.create({
          name: `match-${nomeTimeA}-vs-${iglB.username}`,
          type: ChannelType.GuildText,
          parent: IDS.CATEGORIA_MATCH,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: iglA.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
            {
              id: iglB.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
          ],
        });

        await canalPrivado.send(
          `🛡️ <@${iglB.id}>, **qual o nome da sua equipe?**`
        );

        const coletorTimeB = canalPrivado.createMessageCollector({
          filter: (m) => m.author.id === iglB.id,
          max: 1,
          time: 60000,
        });

        coletorTimeB.on("collect", async (msgB) => {
          const nomeTimeB = msgB.content;

          const embedPrivado = new EmbedBuilder()
            .setColor("#1e90ff")
            .setTitle("🤝 BSS | Amistoso Privado")
            .setDescription(
              "Chat destinado à **marcação da partida**.\n\n" +
              "⚠️ **Pick/Ban apenas por ADMIN**"
            )
            .addFields(
              { name: "🛡️ Time A", value: nomeTimeA, inline: true },
              { name: "🛡️ Time B", value: nomeTimeB, inline: true },
              { name: "🎮 IGL A", value: `<@${iglA.id}>` },
              { name: "🎮 IGL B", value: `<@${iglB.id}>` },
              { name: "📋 Formato", value: "MD3" }
            );

          const botoes = new ActionRowBuilder().addComponents(
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
            components: [botoes],
          });

          await interaction.editReply({
            content: "✅ Match aceito e chat criado.",
          });
        });
      });
    });
  },
};

/* =========================
   PICK / BAN MD3 BOTÕES
========================= */
module.exports.setupPickBan = (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "bss_pickban_start") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply({
          content: "❌ Apenas admin pode iniciar.",
          ephemeral: true,
        });
      }

      const channel = interaction.channel;
      const members = channel.members.filter((m) => !m.user.bot);

      const [iglA, iglB] = members.map((m) => m.id);
      const first = Math.random() < 0.5 ? iglA : iglB;

      activePickBans.set(channel.id, {
        turno: first,
        bans: [],
        picks: [],
        pool: [...MAP_POOL],
      });

      await interaction.reply({
        content: "🎲 **Pick/Ban iniciado!**",
        ephemeral: true,
      });

      sendMapButtons(channel, first, "BAN", [...MAP_POOL]);
    }

    if (interaction.customId.startsWith("pb_")) {
      const state = activePickBans.get(interaction.channel.id);
      if (!state) return;

      if (interaction.user.id !== state.turno) {
        return interaction.reply({ content: "❌ Não é sua vez.", ephemeral: true });
      }

      const mapa = interaction.customId.replace("pb_", "");
      state.pool = state.pool.filter((m) => m !== mapa);

      if (state.bans.length < 4) {
        state.bans.push(mapa);
      } else {
        state.picks.push(mapa);
      }

      state.turno =
        state.turno === interaction.channel.members.first().id
          ? interaction.channel.members.last().id
          : interaction.channel.members.first().id;

      await interaction.deferUpdate();

      if (state.bans.length < 4 || state.picks.length < 2) {
        return sendMapButtons(
          interaction.channel,
          state.turno,
          state.bans.length < 4 ? "BAN" : "PICK",
          state.pool
        );
      }

      const decisivo = state.pool[0];

      const canalPB = await interaction.client.channels.fetch(IDS.PICKBAN);

      await canalPB.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🗺️ Pick/Ban Finalizado (MD3)")
            .addFields(
              { name: "❌ Bans", value: state.bans.join(", ") },
              { name: "✅ Picks", value: state.picks.join(", ") },
              { name: "🎯 Decisivo", value: decisivo }
            ),
        ],
      });

      activePickBans.delete(interaction.channel.id);
    }
  });
};

function sendMapButtons(channel, turno, fase, mapas) {
  const row = new ActionRowBuilder();

  mapas.forEach((m) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`pb_${m}`)
        .setLabel(m)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  channel.send({
    content: `🎮 Vez de <@${turno}> — **${fase}**`,
    components: [row],
  });
          }
