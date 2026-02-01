const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
  PICKBAN: "1464649761213780149",
  RESULTADOS: "1463260797604987014",
  AMISTOSOS: "1466989903232499712",
  CATEGORIA_MATCH: "1463562210591637605",
};

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

module.exports = {
  nome: "match",
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    
    setTimeout(() => message.delete().catch(() => {}), 1000);
    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Qual a disponibilidade?**"];
    let respostas = [];
    let msgsColeta = [];

    const q1 = await message.channel.send(perguntas[0]);
    msgsColeta.push(q1);

    const coletor = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, max: 2 });
    
    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      msgsColeta.push(m);
      if (respostas.length < 2) {
        const q2 = await message.channel.send(perguntas[1]);
        msgsColeta.push(q2);
      }
    });

    coletor.on("end", async () => {
      msgsColeta.forEach(msg => msg.delete().catch(() => {}));
      if (respostas.length < 2) return;

      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);
      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .addFields(
          { name: "🛡️ Time", value: respostas[0], inline: true },
          { name: "📅 Disponibilidade", value: respostas[1], inline: true }
        )
        .setFooter({ text: `IGL_ID:${message.author.id}` }); // ID guardado aqui

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Match").setStyle(ButtonStyle.Success)
      );
      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
};

module.exports.setupPickBan = (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    // --- 1. ACEITAR MATCH ---
    if (interaction.customId === "bss_match_aceitar") {
      const embedOriginal = interaction.message.embeds[0];
      const iglAId = embedOriginal.footer.text.replace("IGL_ID:", "");
      const nomeA = embedOriginal.fields[0].value;

      if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });

      const canal = await interaction.guild.channels.create({
        name: `match-${nomeA}`,
        parent: IDS.CATEGORIA_MATCH,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      });

      await interaction.update({ content: "✅ Partida aceita! Chat privado criado.", embeds: [], components: [] });

      const ask = await canal.send(`🛡️ <@${interaction.user.id}>, **qual o nome da sua equipe?**`);
      const col = canal.createMessageCollector({ filter: (m) => m.author.id === interaction.user.id, max: 1 });
      
      col.on("collect", async (m) => {
        const nomeB = m.content;
        m.delete().catch(() => {}); ask.delete().catch(() => {});

        const embedPrivado = new EmbedBuilder()
          .setTitle("🤝 BSS | Match Privada")
          .setColor("#1E90FF")
          .setDescription("Usem este espaço para combinar. O Pick/Ban é iniciado por um **Staff**.")
          .addFields(
            { name: "Time A", value: nomeA, inline: true },
            { name: "Time B", value: nomeB, inline: true },
            { name: "ID_A", value: iglAId, inline: true },
            { name: "ID_B", value: interaction.user.id, inline: true }
          );

        const rowAdmin = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("pb_start").setLabel("[Staff] Iniciar Pick/Ban").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("match_result").setLabel("[Staff] Resultado").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("match_cancel").setLabel("[Staff] Cancelar").setStyle(ButtonStyle.Danger)
        );
        await canal.send({ embeds: [embedPrivado], components: [rowAdmin] });
      });
    }

    // --- 2. INICIAR PICK/BAN (ADMIN) ---
    if (interaction.customId === "pb_start") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Apenas Staff.", ephemeral: true });

      const emb = interaction.message.embeds[0];
      const stateData = {
        timeA: emb.fields[0].value,
        timeB: emb.fields[1].value,
        iglA: emb.fields[2].value,
        iglB: emb.fields[3].value,
        bans: [], picks: [], pool: [...MAP_POOL], logs: [], statusLado: false
      };
      
      stateData.turno = Math.random() < 0.5 ? stateData.iglA : stateData.iglB;
      activePickBans.set(interaction.channel.id, stateData);

      // Atualiza os botões (remove o de Iniciar)
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("match_result").setLabel("[Staff] Resultado").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("match_cancel").setLabel("[Staff] Cancelar").setStyle(ButtonStyle.Danger)
      );

      await interaction.update({ components: [newRow] });
      return refreshPB(interaction.channel, stateData);
    }

    // --- 3. LÓGICA DE TURNOS (PICK/BAN/SIDE) ---
    const state = activePickBans.get(interaction.channel.id);
    if (!state) return;

    if (interaction.customId.startsWith("side_")) {
      if (interaction.user.id !== state.turno) return interaction.reply({ content: "Não é sua vez!", ephemeral: true });
      const lado = interaction.customId.split("_")[1];
      state.logs.push(`➡️ <@${interaction.user.id}>: **${lado}** em **${state.picks[state.picks.length-1]}**`);
      state.statusLado = false;
      state.turno = (state.turno === state.iglA) ? state.iglB : state.iglA;
      await interaction.deferUpdate();
      return checkFinish(interaction, state);
    }

    if (interaction.customId.startsWith("pb_")) {
      if (interaction.user.id !== state.turno || state.statusLado) return interaction.reply({ content: "Aguarde sua vez!", ephemeral: true });
      const mapa = interaction.customId.replace("pb_", "");
      state.pool = state.pool.filter(m => m !== mapa);

      if (state.bans.length < 4) {
        state.bans.push(mapa);
        state.logs.push(`❌ <@${interaction.user.id}> baniu **${mapa}**`);
        state.turno = (state.turno === state.iglA) ? state.iglB : state.iglA;
      } else {
        state.picks.push(mapa);
        state.logs.push(`✅ <@${interaction.user.id}> pickou **${mapa}**`);
        state.statusLado = true;
        state.turno = (state.turno === state.iglA) ? state.iglB : state.iglA;
      }
      await interaction.deferUpdate();
      return checkFinish(interaction, state);
    }

    // MODAL RESULTADO (Continua igual)
    if (interaction.customId === "match_result") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const modal = new ModalBuilder().setCustomId("modal_resultado").setTitle("Resultado BSS");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("res_vencedor").setLabel("VENCEDOR").setStyle(TextInputStyle.Short)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("res_placar").setLabel("PLACAR MAPAS").setStyle(TextInputStyle.Paragraph)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("res_stats").setLabel("STATS GERAIS").setStyle(TextInputStyle.Short)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("res_mvp").setLabel("MVP").setStyle(TextInputStyle.Short))
        );
        return await interaction.showModal(modal);
    }
  });
};

async function checkFinish(channelOrInteraction, state) {
  const channel = channelOrInteraction.channel || channelOrInteraction;
  if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
    const decisivo = state.pool[0];
    const ladoAuto = Math.random() < 0.5 ? "CT" : "TR";
    
    const embedFinal = new EmbedBuilder()
        .setTitle("🗺️ Pick/Ban Finalizado")
        .setColor("#5865F2")
        .addFields(
            { name: "Time A", value: state.timeA, inline: true },
            { name: "Time B", value: state.timeB, inline: true },
            { name: "Mapas Escolhidos", value: `1. ${state.picks[0]}\n2. ${state.picks[1]}\n3. ${decisivo} (Decisivo)` },
            { name: "Sorteio Decisivo", value: `O IGL <@${state.turno}> começa de **${ladoAuto}** no mapa final.` }
        );

    await channel.send({ embeds: [embedFinal] });
    activePickBans.delete(channel.id);
  } else {
    refreshPB(channel, state);
  }
}

function refreshPB(channel, state) {
  const fase = state.statusLado ? "ESCOLHER LADO" : (state.bans.length < 4 ? "BANIR" : "PICKAR");
  const embed = new EmbedBuilder()
    .setTitle("🗺️ Painel Pick/Ban")
    .setColor(fase === "BANIR" ? "#FF4B4B" : "#4BFF4B")
    .setDescription(`Vez de: <@${state.turno}>\nAção: **${fase}**`)
    .addFields({ name: "📜 Histórico", value: state.logs.length > 0 ? state.logs.join("\n") : "Aguardando..." });

  const rows = [];
  if (state.statusLado) {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("side_CT").setLabel("Começar de CT").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("side_TR").setLabel("Começar de TR").setStyle(ButtonStyle.Primary)
    ));
  } else {
    let row = new ActionRowBuilder();
    state.pool.forEach((m, i) => {
      if (i > 0 && i % 4 === 0) { rows.push(row); row = new ActionRowBuilder(); }
      row.addComponents(new ButtonBuilder().setCustomId(`pb_${m}`).setLabel(m).setStyle(state.bans.length < 4 ? ButtonStyle.Danger : ButtonStyle.Success));
    });
    rows.push(row);
  }
  channel.send({ embeds: [embed], components: rows });
}
