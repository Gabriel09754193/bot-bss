const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

/* ========= CONFIGURAÇÃO OBRIGATÓRIA ========= */
const CONFIG = {
  COMMAND_CHANNEL_ID: "1464661979133247518",
  PUBLIC_CHANNEL_ID: "1464649761213780149",
  ADMIN_LOG_CHANNEL_ID: "1464661705417167064",
  PRIVATE_CATEGORY_ID: "1464644395960893440",
  TURN_TIME: 120000, // 2 minutos
};
/* =========================================== */

const MAPS = [
  "Ancient",
  "Anubis",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass",
];

const matches = new Map();

module.exports = {
  nome: "pickban",

  async execute(message, args) {
    if (message.channel.id !== CONFIG.COMMAND_CHANNEL_ID) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Apenas administradores.");

    const iglA = message.mentions.users.at(0);
    const iglB = message.mentions.users.at(1);
    if (!iglA || !iglB)
      return message.reply("Use `.pickban @iglA @iglB`");

    const guild = message.guild;

    // 📂 categoria
    const category = await guild.channels.create({
      name: `PICK-BAN`,
      type: ChannelType.GuildCategory,
      parent: CONFIG.PRIVATE_CATEGORY_ID,
    });

    // 🔒 canal privado
    const channel = await guild.channels.create({
      name: "pick-ban",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
        { id: iglA.id, allow: ["ViewChannel", "SendMessages"] },
        { id: iglB.id, allow: ["ViewChannel", "SendMessages"] },
      ],
    });

    const starter = Math.random() < 0.5 ? iglA.id : iglB.id;

    const publicMsg = await guild.channels.cache
      .get(CONFIG.PUBLIC_CHANNEL_ID)
      .send({ embeds: [publicEmbed("Iniciado", [], [], MAPS)] });

    matches.set(channel.id, {
      igls: [iglA, iglB],
      turn: starter,
      phase: "BAN",
      maps: [...MAPS],
      bans: [],
      picks: [],
      sidePending: null,
      timer: null,
      publicMsg,
      channel,
    });

    channel.send(`🎮 **Pick/Ban iniciado!**\n<@${starter}> começa.`);

    sendTurnEmbed(channel.id);
  },
};

/* ============ FUNÇÕES ============ */

function mapButtons(maps) {
  const rows = [];
  for (let i = 0; i < maps.length; i += 3) {
    rows.push(
      new ActionRowBuilder().addComponents(
        maps.slice(i, i + 3).map(m =>
          new ButtonBuilder()
            .setCustomId(`map_${m}`)
            .setLabel(m)
            .setStyle(ButtonStyle.Secondary)
        )
      )
    );
  }
  return rows;
}

function sendTurnEmbed(id) {
  const m = matches.get(id);
  if (!m) return;

  clearTimeout(m.timer);

  const embed = new EmbedBuilder()
    .setColor("#1e1e1e")
    .setTitle("🎮 PICK & BAN — MD3 | BSS")
    .setDescription(
      `👤 **IGL da vez:** <@${m.turn}>\n` +
      `🔄 **Fase:** ${m.phase}\n\n` +
      `🗺 **Mapas disponíveis:**\n${m.maps.join(" • ")}\n\n` +
      `❌ Bans: ${m.bans.join(", ") || "—"}\n` +
      `🎯 Picks: ${m.picks.map(p => p.map).join(", ") || "—"}`
    );

  m.channel.send({
    embeds: [embed],
    components: mapButtons(m.maps),
  });

  m.timer = setTimeout(() => autoAction(id), CONFIG.TURN_TIME);
}

function autoAction(id) {
  const m = matches.get(id);
  if (!m) return;

  const map = m.maps[Math.floor(Math.random() * m.maps.length)];
  m.maps = m.maps.filter(x => x !== map);

  if (m.bans.length < 2 || (m.bans.length < 4 && m.picks.length === 2)) {
    m.bans.push(map);
  } else {
    m.picks.push({ map, side: "Sorteado" });
  }

  nextTurn(id);
}

function nextTurn(id) {
  const m = matches.get(id);
  if (!m) return;

  clearTimeout(m.timer);

  m.turn = m.turn === m.igls[0].id ? m.igls[1].id : m.igls[0].id;

  updatePublic(m);

  if (m.bans.length === 4 && m.picks.length === 2) {
    m.channel.send("✅ **Pick/Ban finalizado!**");
    return;
  }

  sendTurnEmbed(id);
}

function updatePublic(m) {
  m.publicMsg.edit({
    embeds: [
      publicEmbed(
        "Em andamento",
        m.bans,
        m.picks.map(p => p.map),
        m.maps
      ),
    ],
  });
}

function publicEmbed(status, bans, picks, maps) {
  return new EmbedBuilder()
    .setColor("#ff9f1c")
    .setTitle("🎮 Pick/Ban — Base Strikes Series")
    .setDescription(
      `❌ **Bans:** ${bans.join(", ") || "—"}\n\n` +
      `🎯 **Picks:** ${picks.join(", ") || "—"}\n\n` +
      `🗺 **Restantes:** ${maps.join(", ") || "—"}\n\n` +
      `⏱ **Status:** ${status}`
    );
        }
