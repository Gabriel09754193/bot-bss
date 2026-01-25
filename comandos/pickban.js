const {
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");

// ================= CONFIGURAÇÕES =================
const CONFIG = {
  STAFF_ROLE_ID: "1463257906546868463",
  CATEGORY_PRIVATE_ID: "1464644395960893440",
  PUBLIC_LOG_CHANNEL_ID: "1464649761213780149",
  TIMEOUT_MS: 2 * 60 * 1000, // 2 minutos
};

const MAP_POOL = [
  "Ancient",
  "Anubis",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass",
];

// =================================================

const activePickBans = new Map();

module.exports = {
  nome: "pickban",

  async execute(message, args, client) {
    // ====== VALIDAÇÕES ======
    if (!message.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
      return message.reply("❌ Apenas a administração pode iniciar o pick/ban.");
    }

    const iglA = message.mentions.users.at(0);
    const iglB = message.mentions.users.at(1);

    if (!iglA || !iglB) {
      return message.reply("❌ Use: `.pickban @iglA @iglB`");
    }

    // ====== CRIAR CANAL PRIVADO ======
    const channel = await message.guild.channels.create({
      name: `pickban-${iglA.username}-vs-${iglB.username}`,
      type: ChannelType.GuildText,
      parent: CONFIG.CATEGORY_PRIVATE_ID,
      permissionOverwrites: [
        {
          id: message.guild.id,
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

    // ====== ESTADO ======
    const state = {
      iglA,
      iglB,
      teamA: null,
      teamB: null,
      availableMaps: [...MAP_POOL],
      bans: [],
      picks: [],
      decider: null,
      turn: null,
      step: 0,
      publicMessage: null,
    };

    activePickBans.set(channel.id, state);

    // ====== EMBED PÚBLICO ======
    const publicChannel = message.guild.channels.cache.get(
      CONFIG.PUBLIC_LOG_CHANNEL_ID
    );

    const publicEmbed = new EmbedBuilder()
      .setTitle("🎮 Pick & Ban MD3 — BSS")
      .setDescription("Pick/Ban iniciado. Aguardando times...")
      .setColor(0x1e1e2e)
      .setFooter({ text: "Base Strike Series • CS2" });

    const publicMsg = await publicChannel.send({ embeds: [publicEmbed] });
    state.publicMessage = publicMsg;

    // ====== INÍCIO ======
    await channel.send(
      `🔒 **Pick/Ban iniciado**\n${iglA} ${iglB}\n\n🏷️ **IGL ${iglA}, digite o nome do seu time:**`
    );

    const collector = channel.createMessageCollector({
      time: CONFIG.TIMEOUT_MS * 20,
    });

    collector.on("collect", async (msg) => {
      if (![iglA.id, iglB.id].includes(msg.author.id)) return;

      // ====== NOMES DOS TIMES ======
      if (!state.teamA && msg.author.id === iglA.id) {
        state.teamA = msg.content.trim();
        await channel.send(
          `✅ Time registrado: **${state.teamA}**\n\n🏷️ **IGL ${iglB}, digite o nome do seu time:**`
        );
        return updatePublicEmbed(state);
      }

      if (state.teamA && !state.teamB && msg.author.id === iglB.id) {
        state.teamB = msg.content.trim();

        // Sorteio de início
        state.turn = Math.random() < 0.5 ? "A" : "B";

        await channel.send(
          `🎲 Sorteio realizado!\n👉 **${
            state.turn === "A" ? state.teamA : state.teamB
          }** começa banindo.\n\n🗺️ Mapas disponíveis:\n${state.availableMaps.join(
            ", "
          )}\n\n🚫 Digite o nome do mapa para **BANIR**`
        );

        return updatePublicEmbed(state);
      }

      // ====== BANS (4) ======
      if (state.bans.length < 4) {
        const map = normalizeMap(msg.content);
        if (!state.availableMaps.includes(map)) return;

        const team =
          state.turn === "A" ? state.teamA : state.teamB;

        state.bans.push({ team, map });
        state.availableMaps = state.availableMaps.filter(
          (m) => m !== map
        );
        state.turn = state.turn === "A" ? "B" : "A";

        await channel.send(
          `🚫 **${team}** baniu **${map}**\n\nMapas restantes:\n${state.availableMaps.join(
            ", "
          )}`
        );

        await updatePublicEmbed(state);

        if (state.bans.length === 4) {
          await channel.send(
            `✅ Fase de **PICKS** iniciada.\n👉 **${
              state.turn === "A" ? state.teamA : state.teamB
            }**, escolha um mapa`
          );
        }
        return;
      }

      // ====== PICKS (2) ======
      if (state.picks.length < 2) {
        const map = normalizeMap(msg.content);
        if (!state.availableMaps.includes(map)) return;

        const pickingTeam =
          state.turn === "A" ? state.teamA : state.teamB;
        const enemyTeam =
          state.turn === "A" ? state.teamB : state.teamA;

        state.picks.push({
          team: pickingTeam,
          map,
          side: null,
        });

        state.availableMaps = state.availableMaps.filter(
          (m) => m !== map
        );

        state.turn = state.turn === "A" ? "B" : "A";

        await channel.send(
          `✅ **${pickingTeam}** escolheu **${map}**\n🎯 **${enemyTeam}**, escolha o lado inicial (CT/TR)`
        );

        await updatePublicEmbed(state);
        return;
      }

      // ====== LADOS DOS PICKS ======
      const lastPick = state.picks.find((p) => !p.side);
      if (lastPick) {
        const side = msg.content.toUpperCase();
        if (!["CT", "TR"].includes(side)) return;

        lastPick.side = side;

        await channel.send(
          `🧭 Lado definido: **${side}** no mapa **${lastPick.map}**`
        );

        await updatePublicEmbed(state);

        if (state.picks.every((p) => p.side)) {
          // DECIDER
          state.decider = state.availableMaps[0];
          const randomSide = Math.random() < 0.5 ? "CT" : "TR";

          await channel.send(
            `⚔️ **Mapa decisivo:** **${state.decider}**\n🎲 Lado inicial sorteado: **${randomSide}**`
          );

          await updatePublicEmbed(state, true);
          collector.stop();
        }
      }
    });
  },
};

// ================= FUNÇÕES =================

function normalizeMap(input) {
  return MAP_POOL.find(
    (m) => m.toLowerCase() === input.toLowerCase()
  );
}

async function updatePublicEmbed(state, finished = false) {
  const embed = new EmbedBuilder()
    .setTitle("🎮 Pick & Ban MD3 — BSS")
    .setColor(finished ? 0x2ecc71 : 0x3498db)
    .addFields(
      {
        name: "🏷️ Times",
        value:
          state.teamA && state.teamB
            ? `${state.teamA} vs ${state.teamB}`
            : "Aguardando...",
      },
      {
        name: "🚫 Bans",
        value:
          state.bans.length > 0
            ? state.bans.map((b) => `• ${b.team}: ${b.map}`).join("\n")
            : "—",
      },
      {
        name: "✅ Picks",
        value:
          state.picks.length > 0
            ? state.picks
                .map(
                  (p) =>
                    `• ${p.team}: ${p.map} (${p.side || "lado pendente"})`
                )
                .join("\n")
            : "—",
      },
      {
        name: "⚔️ Decider",
        value: state.decider || "—",
      }
    )
    .setFooter({ text: "Base Strike Series • CS2" });

  await state.publicMessage.edit({ embeds: [embed] });
      }
