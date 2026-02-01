const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");

const matches = new Map();

// MAP POOL (SEM VERTIGO / COM DUST2)
const MAPS = [
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
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.reply("❌ Apenas **admins** podem criar partidas.");
    }

    // 📌 IDs
    const PARTIDAS_ESPERA = "1463270089376927845";
    const PICKBAN_CANAL = "1464649761213780149";
    const AMISTOSOS_CANAL = "1466989903232499712";
    const MATCH_CATEGORY = "1463562210591637605";

    // 📝 perguntas
    const perguntas = [
      "🛡️ Nome do **Time A**:",
      "⚔️ Nome do **Time B**:",
      "🎮 Formato (`md1` ou `md3`):",
      "👤 Marque o **IGL do Time A**:",
      "👤 Marque o **IGL do Time B**:",
    ];

    let respostas = [];
    let etapa = 0;

    const pergunta = await message.channel.send(perguntas[0]);

    const collector = message.channel.createMessageCollector({
      filter: (m) => m.author.id === message.author.id,
      max: perguntas.length,
      time: 120000,
    });

    collector.on("collect", async (m) => {
      respostas.push(m.content);
      etapa++;
      if (etapa < perguntas.length) {
        await pergunta.edit(perguntas[etapa]);
      }
    });

    collector.on("end", async () => {
      if (respostas.length < perguntas.length) {
        return message.reply("❌ Match cancelado (tempo esgotado).");
      }

      const [timeA, timeB, formato, iglA, iglB] = respostas;

      // 📂 canal privado
      const canal = await message.guild.channels.create({
        name: `match-${timeA.toLowerCase().replace(/ /g, "-")}`,
        type: ChannelType.GuildText,
        parent: MATCH_CATEGORY || null,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: iglA.replace(/[<@!>]/g, ""),
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: iglB.replace(/[<@!>]/g, ""),
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });

      // 🧠 estado inicial
      matches.set(canal.id, {
        timeA,
        timeB,
        iglA,
        iglB,
        formato,
        maps: [...MAPS],
        bans: [],
        picks: [],
        turno: "B", // Time B aceita primeiro
        fase: "aceitacao",
      });

      const embed = new EmbedBuilder()
        .setColor("#1e90ff")
        .setTitle("🔥 BSS | Match Criado")
        .setDescription(
          `🛡️ **${timeA}**\n⚔️ **${timeB}**\n\n` +
            `🎮 Formato: **${formato.toUpperCase()}**\n\n` +
            `📌 Finalidade deste chat:\n` +
            `• Combinar horário\n• Confirmar presença\n• Após isso, iniciar Pick/Ban\n\n` +
            `⚠️ **O IGL do Time B deve ACEITAR o confronto abaixo.**`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("aceitar_match")
          .setLabel("✅ Aceitar Match")
          .setStyle(ButtonStyle.Success)
      );

      await canal.send({
        content: `${iglA} ${iglB}`,
        embeds: [embed],
        components: [row],
      });

      const espera = message.guild.channels.cache.get(PARTIDAS_ESPERA);
      if (espera) {
        espera.send(
          `⏳ **Partida criada:** ${timeA} vs ${timeB} (${formato.toUpperCase()})`
        );
      }

      await message.reply("✅ Match criado!");
    });

    // 🔘 BOTÕES
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      const match = matches.get(interaction.channel.id);
      if (!match) return;

      // ✅ ACEITAR MATCH (IGL B)
      if (interaction.customId === "aceitar_match") {
        if (interaction.user.id !== match.iglB.replace(/[<@!>]/g, "")) {
          return interaction.reply({
            content: "❌ Apenas o **IGL do Time B** pode aceitar.",
            ephemeral: true,
          });
        }

        match.fase = "pickban";
        match.turno = Math.random() < 0.5 ? "A" : "B";

        await interaction.update({
          components: [],
          embeds: [
            new EmbedBuilder()
              .setColor("#00ff99")
              .setTitle("🗺️ Pick/Ban Iniciado")
              .setDescription(
                `🎲 Sorteio realizado!\n\n` +
                  `➡️ **${match.turno === "A" ? match.timeA : match.timeB} começa banindo.**\n\n` +
                  `🗺️ Map Pool:\n${match.maps.join(" • ")}`
              ),
          ],
        });

        const pickban = interaction.guild.channels.cache.get(PICKBAN_CANAL);
        if (pickban) {
          pickban.send(
            `🗺️ **Pick/Ban iniciado:** ${match.timeA} vs ${match.timeB}`
          );
        }

        sendBanButtons(interaction.channel, match);
      }

      // 🛑 BAN
      if (interaction.customId.startsWith("ban_")) {
        const mapa = interaction.customId.replace("ban_", "");

        if (!match.maps.includes(mapa)) {
          return interaction.reply({ content: "❌ Mapa inválido.", ephemeral: true });
        }

        match.maps = match.maps.filter((m) => m !== mapa);
        match.bans.push(mapa);
        match.turno = match.turno === "A" ? "B" : "A";

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff4444")
              .setTitle("🛑 Ban Realizado")
              .setDescription(
                `❌ Mapa banido: **${mapa}**\n\n` +
                  `➡️ Vez de **${match.turno === "A" ? match.timeA : match.timeB}**`
              ),
          ],
          components: [],
        });

        if (
          (match.formato === "md1" && match.bans.length < 6) ||
          (match.formato === "md3" && match.bans.length < 2)
        ) {
          sendBanButtons(interaction.channel, match);
        } else {
          sendPickButtons(interaction.channel, match);
        }
      }

      // 🎯 PICK
      if (interaction.customId.startsWith("pick_")) {
        const mapa = interaction.customId.replace("pick_", "");

        match.picks.push(mapa);
        match.maps = match.maps.filter((m) => m !== mapa);

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor("#ffaa00")
              .setTitle("🎯 Mapa Escolhido")
              .setDescription(`🗺️ **${mapa}** foi pickado.`),
          ],
          components: [],
        });

        const amistoso = interaction.guild.channels.cache.get(AMISTOSOS_CANAL);
        if (amistoso) {
          amistoso.send(
            `🎮 **Mapa definido:**
