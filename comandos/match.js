const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");

const matches = new Map();

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

  async execute(message) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.reply("❌ Apenas admins podem usar este comando.");
    }

    const PARTIDAS_ESPERA = "1463270089376927845";
    const PICKBAN_CANAL = "1464649761213780149";
    const MATCH_CATEGORY = "1463562210591637605";

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
        return message.reply("❌ Tempo esgotado.");
      }

      const [timeA, timeB, formato, iglA, iglB] = respostas;

      const canal = await message.guild.channels.create({
        name: `match-${timeA.toLowerCase().replace(/ /g, "-")}`,
        type: ChannelType.GuildText,
        parent: MATCH_CATEGORY,
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

      matches.set(canal.id, {
        timeA,
        timeB,
        iglA: iglA.replace(/[<@!>]/g, ""),
        iglB: iglB.replace(/[<@!>]/g, ""),
        formato,
        maps: [...MAPS],
        bans: [],
        turno: null,
      });

      const embed = new EmbedBuilder()
        .setColor("#1e90ff")
        .setTitle("🔥 Match Criado")
        .setDescription(
          `🛡️ **${timeA}** vs ⚔️ **${timeB}**\n\n` +
          `🎮 Formato: **${formato.toUpperCase()}**\n\n` +
          `⏳ Aguardando **IGL do Time B** aceitar.`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("aceitar_match")
          .setLabel("✅ Aceitar Match")
          .setStyle(ButtonStyle.Success)
      );

      await canal.send({
        content: `<@${iglA.replace(/[<@!>]/g, "")}> <@${iglB.replace(/[<@!>]/g, "")}>`,
        embeds: [embed],
        components: [row],
      });

      const espera = message.guild.channels.cache.get(PARTIDAS_ESPERA);
      if (espera) {
        espera.send(`⏳ ${timeA} vs ${timeB} criado.`);
      }
    });
  },
};

// 🔘 LISTENER ÚNICO (CORRETO)
module.exports.interaction = async (interaction) => {
  if (!interaction.isButton()) return;

  const match = matches.get(interaction.channel.id);
  if (!match) return;

  if (interaction.customId === "aceitar_match") {
    if (interaction.user.id !== match.iglB) {
      return interaction.reply({
        content: "❌ Apenas o IGL do Time B pode aceitar.",
        ephemeral: true,
      });
    }

    match.turno = Math.random() < 0.5 ? "A" : "B";

    await interaction.update({
      components: [],
      embeds: [
        new EmbedBuilder()
          .setColor("#00ff99")
          .setTitle("🗺️ Pick/Ban Iniciado")
          .setDescription(
            `🎲 Sorteio feito!\n\n` +
            `➡️ **${match.turno === "A" ? match.timeA : match.timeB}** começa banindo.`
          ),
      ],
    });

    enviarBans(interaction.channel, match);
  }

  if (interaction.customId.startsWith("ban_")) {
    const mapa = interaction.customId.replace("ban_", "");
    if (!match.maps.includes(mapa)) return;

    match.maps = match.maps.filter((m) => m !== mapa);
    match.bans.push(mapa);
    match.turno = match.turno === "A" ? "B" : "A";

    await interaction.update({ components: [] });

    if (
      (match.formato === "md1" && match.bans.length < 6) ||
      (match.formato === "md3" && match.bans.length < 2)
    ) {
      enviarBans(interaction.channel, match);
    } else {
      interaction.channel.send(
        `🗺️ **Mapa final:** ${match.maps[0]}`
      );
    }
  }
};

function enviarBans(channel, match) {
  const row = new ActionRowBuilder();
  match.maps.forEach((mapa) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`ban_${mapa}`)
        .setLabel(mapa)
        .setStyle(ButtonStyle.Danger)
    );
  });

  channel.send({
    content: `🛑 **${match.turno === "A" ? match.timeA : match.timeB}**, escolha um mapa para BANIR:`,
    components: [row],
  });
}
