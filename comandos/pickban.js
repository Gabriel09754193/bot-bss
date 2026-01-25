const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

/* ================= CONFIG ================= */

const CONFIG = {
  COMMAND_CHANNEL_ID: "1464661979133247518",
  PUBLIC_CHANNEL_ID: "1464649761213780149",
  ADMIN_LOG_CHANNEL_ID: "1464661705417167064",
  RESPONSE_TIME: 60
};

const MAP_POOL = [
  "Ancient",
  "Anubis",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass"
];

const sessions = new Map();

/* ================= COMANDO ================= */

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.content.startsWith(".pickban")) return;
    if (message.channel.id !== CONFIG.COMMAND_CHANNEL_ID) return;

    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Apenas administradores podem iniciar o pick/ban.");
    }

    const mentions = message.mentions.users;
    if (mentions.size !== 2) {
      return message.reply("❌ Mencione exatamente **2 IGLs**.");
    }

    const [iglA, iglB] = [...mentions.values()];

    await message.reply("✏️ Nome do **Time A**:");
    const teamA = (await message.channel.awaitMessages({
      max: 1, time: 30000, filter: m => m.author.id === message.author.id
    })).first().content;

    await message.reply("✏️ Nome do **Time B**:");
    const teamB = (await message.channel.awaitMessages({
      max: 1, time: 30000, filter: m => m.author.id === message.author.id
    })).first().content;

    const firstIGL = Math.random() < 0.5 ? iglA : iglB;

    const session = {
      iglA,
      iglB,
      teamA,
      teamB,
      currentIGL: firstIGL,
      mapsLeft: [...MAP_POOL],
      bansDone: 0,
      picksDone: 0,
      phase: "BAN"
    };

    sessions.set(message.id, session);

    const publicChannel = message.guild.channels.cache.get(CONFIG.PUBLIC_CHANNEL_ID);

    const msg = await publicChannel.send({
      content: `🎮 **PICK/BAN BSS** — ${teamA} 🆚 ${teamB}\n👤 IGL da vez: ${firstIGL}`,
      embeds: [buildEmbed(session)],
      components: buildButtons(session)
    });

    session.publicMessage = msg;
  }
};

/* ================= BOTÕES ================= */

module.exports.interaction = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const session = [...sessions.values()].find(s => s.publicMessage.id === interaction.message.id);
    if (!session) return;

    if (interaction.user.id !== session.currentIGL.id) {
      return interaction.reply({ content: "❌ Não é sua vez.", ephemeral: true });
    }

    const map = interaction.customId.split("_")[1];

    session.mapsLeft = session.mapsLeft.filter(m => m !== map);
    session.bansDone++;

    session.currentIGL =
      session.currentIGL.id === session.iglA.id ? session.iglB : session.iglA;

    if (session.bansDone === 2) session.phase = "PICK";

    await interaction.update({
      content: `🎮 **PICK/BAN BSS** — ${session.teamA} 🆚 ${session.teamB}\n👤 IGL da vez: ${session.currentIGL}`,
      embeds: [buildEmbed(session)],
      components: buildButtons(session)
    });
  }
};

/* ================= UI ================= */

function buildEmbed(session) {
  return new EmbedBuilder()
    .setTitle("🎮 Pick / Ban — BSS")
    .setColor("#ff2b2b")
    .setDescription(
      `**Fase:** ${session.phase}\n` +
      `**IGL da vez:** ${session.currentIGL}\n\n` +
      `🗺️ **Mapas restantes:**\n` +
      session.mapsLeft.map(m => `🟢 ${m}`).join("\n")
    );
}

function buildButtons(session) {
  const rows = [];
  let row = new ActionRowBuilder();

  session.mapsLeft.forEach(map => {
    if (row.components.length === 5) {
      rows.push(row);
      row = new ActionRowBuilder();
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`map_${map}`)
        .setLabel(`${session.phase} ${map}`)
        .setStyle(session.phase === "BAN" ? ButtonStyle.Danger : ButtonStyle.Success)
    );
  });

  rows.push(row);
  return rows;
}
