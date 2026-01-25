const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

/* =====================================================
   🔧 CONFIGURAÇÕES (MUDE APENAS AQUI)
===================================================== */

const CONFIG = {
  // 📂 Categoria onde será criado o chat privado do pick/ban
  PICKBAN_CATEGORY_ID: "1464644395960893440",

  // 📣 Canal público onde o embed será enviado e editado
  PUBLIC_CHANNEL_ID: "1464649761213780149",

  // 📜 Canal de log administrativo (opcional)
  ADMIN_LOG_CHANNEL_ID: "1464661705417167064",

  // ⏱️ Tempo para cada ação (2 minutos)
  ACTION_TIME: 120000,
};

/* =====================================================
   🗺️ MAP POOL OFICIAL
===================================================== */

const MAP_POOL = [
  "Ancient",
  "Anubis",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass",
];

/* =====================================================
   📌 COMANDO
===================================================== */

module.exports = {
  nome: "pickban",

  async execute(client, message, args) {
    // 🔐 Apenas administradores
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const iglA = message.mentions.users.at(0);
    const iglB = message.mentions.users.at(1);

    if (!iglA || !iglB) {
      return message.reply("❌ Use: `.pickban @IGL_TimeA @IGL_TimeB`");
    }

    /* =====================================================
       🔒 CRIAR CANAL PRIVADO
    ===================================================== */

    const pickbanChannel = await message.guild.channels.create({
      name: `pickban-${iglA.username}-vs-${iglB.username}`,
      type: ChannelType.GuildText,
      parent: CONFIG.PICKBAN_CATEGORY_ID,
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: iglA.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: iglB.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });

    /* =====================================================
       🧠 ESTADO DO PICK/BAN
    ===================================================== */

    const state = {
      igls: { A: iglA, B: iglB },
      bans: { A: [], B: [] },
      picks: { A: null, B: null },
      availableMaps: [...MAP_POOL],
      turn: Math.random() < 0.5 ? "A" : "B",
      decider: null,
    };

    /* =====================================================
       📣 EMBED PÚBLICO (EDITÁVEL)
    ===================================================== */

    const publicChannel = message.guild.channels.cache.get(
      CONFIG.PUBLIC_CHANNEL_ID
    );

    const publicEmbed = new EmbedBuilder()
      .setTitle("🎮 Pick & Ban MD3 – Base Strike Series")
      .setDescription(`**${iglA.username} 🆚 ${iglB.username}**`)
      .setColor(0x8b0000)
      .addFields(
        { name: "❌ BANS", value: "—", inline: false },
        { name: "🗺️ PICKS", value: "—", inline: false },
        { name: "⚖️ DECIDER", value: "—", inline: false },
        { name: "Status", value: "⏳ Em andamento", inline: false }
      )
      .setFooter({ text: "Base Strike Series • CS2" });

    const publicMsg = await publicChannel.send({ embeds: [publicEmbed] });

    /* =====================================================
       🎲 INÍCIO
    ===================================================== */

    await pickbanChannel.send(
      `🎮 **Pick/Ban MD3 iniciado**\n\nIGLs:\n• <@${iglA.id}>\n• <@${iglB.id}>\n\n🎲 **Sorteio:** <@${state.igls[state.turn].id}> começa BANINDO.`
    );

    runBanPhase(pickbanChannel, publicMsg, state);
  },
};

/* =====================================================
   ❌ FASE DE BAN (4 BANS)
===================================================== */

async function runBanPhase(channel, publicMsg, state) {
  for (let i = 0; i < 4; i++) {
    const team = state.turn;
    const igl = state.igls[team];

    await channel.send(
      `❌ **Vez de <@${igl.id}>**\nBanir mapa:\n${state.availableMaps.join(
        ", "
      )}\n⏱️ 2 minutos`
    );

    const map = await waitForMap(channel, igl.id, state.availableMaps);
    state.bans[team].push(map);
    state.availableMaps = state.availableMaps.filter((m) => m !== map);
    state.turn = team === "A" ? "B" : "A";

    await updatePublicEmbed(publicMsg, state);
  }

  runPickPhase(channel, publicMsg, state);
}

/* =====================================================
   🗺️ FASE DE PICK (2 PICKS)
===================================================== */

async function runPickPhase(channel, publicMsg, state) {
  for (let i = 0; i < 2; i++) {
    const pickerTeam = state.turn;
    const sideChooser = pickerTeam === "A" ? "B" : "A";

    const picker = state.igls[pickerTeam];
    const chooser = state.igls[sideChooser];

    await channel.send(
      `🗺️ **<@${picker.id}>**, escolha o mapa:\n${state.availableMaps.join(
        ", "
      )}`
    );

    const map = await waitForMap(channel, picker.id, state.availableMaps);
    state.availableMaps = state.availableMaps.filter((m) => m !== map);

    await channel.send(
      `🔀 **<@${chooser.id}>**, escolha o lado inicial em **${map}** (CT/TR)`
    );

    const side = await waitForSide(channel, chooser.id);

    state.picks[pickerTeam] = { map, side };
    state.turn = sideChooser;

    await updatePublicEmbed(publicMsg, state);
  }

  state.decider = state.availableMaps[0];
  await updatePublicEmbed(publicMsg, state, true);

  await channel.send(
    `⚖️ **Mapa Decisivo:** ${state.decider}\n🎲 Lados sorteados automaticamente.\n✅ Pick/Ban finalizado.`
  );
}

/* =====================================================
   ⏱️ UTILITÁRIOS
===================================================== */

function waitForMap(channel, userId, validMaps) {
  return new Promise((resolve) => {
    const collector = channel.createMessageCollector({
      time: CONFIG.ACTION_TIME,
      filter: (m) =>
        m.author.id === userId &&
        validMaps.map((v) => v.toLowerCase()).includes(m.content.toLowerCase()),
    });

    collector.on("collect", (m) => {
      collector.stop();
      resolve(
        validMaps.find(
          (v) => v.toLowerCase() === m.content.toLowerCase()
        )
      );
    });

    collector.on("end", (c) => {
      if (c.size === 0) resolve(validMaps[0]);
    });
  });
}

function waitForSide(channel, userId) {
  return new Promise((resolve) => {
    const collector = channel.createMessageCollector({
      time: CONFIG.ACTION_TIME,
      filter: (m) =>
        m.author.id === userId &&
        ["CT", "TR"].includes(m.content.toUpperCase()),
    });

    collector.on("collect", (m) => {
      collector.stop();
      resolve(m.content.toUpperCase());
    });

    collector.on("end", (c) => {
      if (c.size === 0) resolve("CT");
    });
  });
}

/* =====================================================
   📣 UPDATE EMBED PÚBLICO
===================================================== */

async function updatePublicEmbed(msg, state, finished = false) {
  const embed = EmbedBuilder.from(msg.embeds[0]);
  embed.spliceFields(0, embed.data.fields.length);

  embed.addFields(
    {
      name: "❌ BANS",
      value: `Time A: ${state.bans.A.join(", ") || "—"}\nTime B: ${
        state.bans.B.join(", ") || "—"
      }`,
    },
    {
      name: "🗺️ PICKS",
      value:
        Object.entries(state.picks)
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `${k === "A" ? "Time A" : "Time B"}: ${v.map} (${v.side})`
          )
          .join("\n") || "—",
    },
    {
      name: "⚖️ DECIDER",
      value: state.decider || "—",
    },
    {
      name: "Status",
      value: finished ? "🏁 Finalizado" : "⏳ Em andamento",
    }
  );

  await msg.edit({ embeds: [embed] });
            }
