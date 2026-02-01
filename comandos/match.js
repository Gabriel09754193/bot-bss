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
  CATEGORIA_MATCH: "1463562210591637605",
};

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas **administradores** podem usar este comando.");
    }

    // --- ETAPA 1: COLETA IGL A ---
    const perguntas = [
      "🛡️ **Qual o nome da sua equipe?**",
      "📅 **Disponibilidade da equipe** (ex: Hoje 20h, Amanhã após 18h):",
    ];

    let respostas = [];
    let etapa = 0;

    await message.reply("⚔️ **BSS | Solicitação de Amistoso**\nFormato disponível: **MD3 (Melhor de 3)**");
    
    const coletor = message.channel.createMessageCollector({
      filter: (m) => m.author.id === message.author.id,
      max: perguntas.length,
      time: 120000,
    });

    await message.channel.send(perguntas[etapa]);

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      etapa++;
      if (etapa < perguntas.length) await message.channel.send(perguntas[etapa]);
    });

    coletor.on("end", async () => {
      if (respostas.length < perguntas.length) return;

      const [nomeTimeA, disponibilidade] = respostas;
      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      const embedEspera = new EmbedBuilder()
        .setColor("#ff8c00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .addFields(
          { name: "🛡️ Time Solicitante", value: nomeTimeA, inline: true },
          { name: "🎮 IGL", value: `<@${message.author.id}>`, inline: true },
          { name: "📅 Disponibilidade", value: disponibilidade },
          { name: "⚠️ Aviso", value: "Aceite apenas se for jogar a partida • Formato **MD3**" }
        )
        .setFooter({ text: `ID:${message.author.id}` }); // ID escondido no footer para resgate

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Match").setStyle(ButtonStyle.Success)
      );

      await canalEspera.send({ embeds: [embedEspera], components: [row] });
      await message.channel.send("✅ Solicitação enviada para Partidas em Espera!");
    });
  },
};

/* =========================
   SISTEMA DE INTERAÇÕES
========================= */
module.exports.setupPickBan = (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    // --- 1. ACEITAR MATCH (IGL B) ---
    if (interaction.customId === "bss_match_aceitar") {
      const embedOriginal = interaction.message.embeds[0];
      const iglAId = embedOriginal.footer.text.replace("ID:", "");
      const nomeTimeA = embedOriginal.fields[0].value;

      if (interaction.user.id === iglAId) {
        return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const canalPrivado = await interaction.guild.channels.create({
        name: `match-${nomeTimeA}-vs-time-b`,
        parent: IDS.CATEGORIA_MATCH,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      });

      await canalPrivado.send(`🛡️ <@${interaction.user.id}>, **qual o nome da sua equipe?**`);
      
      const coletorTimeB = canalPrivado.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        max: 1
      });

      coletorTimeB.on("collect", async (m) => {
        const nomeTimeB = m.content;
        
        const embedInfo = new EmbedBuilder()
          .setColor("#1e90ff")
          .setTitle("🤝 BSS | Amistoso Privado")
          .setDescription("Bem-vindos! Este chat é para marcação de horários e combinação com a Administração.\n\n⚠️ **Pick/Ban apenas por Administradores**")
          .addFields(
            { name: "⚔️ Confronto", value: `**${nomeTimeA}** vs **${nomeTimeB}**` },
            { name: "🎮 IGL A", value: `<@${iglAId}>`, inline: true },
            { name: "🎮 IGL B", value: `<@${interaction.user.id}>`, inline: true }
          );

        const botoesAdmin = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("bss_admin_start_pb").setLabel("Iniciar Pick/Ban").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("bss_admin_cancel").setLabel("Cancelar Match").setStyle(ButtonStyle.Danger)
        );

        await canalPrivado.send({ embeds: [embedInfo], components: [botoesAdmin] });
        await interaction.editReply(`✅ Chat criado: ${canalPrivado}`);
      });
    }

    // --- 2. INICIAR PICK/BAN (ADMIN ONLY) ---
    if (interaction.customId === "bss_admin_start_pb") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Apenas Admins podem iniciar o Pick/Ban.", ephemeral: true });
      }

      const embed = interaction.message.embeds[0];
      const iglA = embed.fields[1].value.match(/\d+/)[0];
      const iglB = embed.fields[2].value.match(/\d+/)[0];
      const primeiro = Math.random() < 0.5 ? iglA : iglB;

      activePickBans.set(interaction.channel.id, {
        iglA, iglB, turno: primeiro,
        bans: [], picks: [], pool: [...MAP_POOL]
      });

      await interaction.reply({ content: "🎲 Pick/Ban iniciado!", ephemeral: true });
      return sendMapButtons(interaction.channel, activePickBans.get(interaction.channel.id));
    }

    // --- 3. LÓGICA DE CLIQUE NOS MAPAS ---
    if (interaction.customId.startsWith("pb_")) {
      const state = activePickBans.get(interaction.channel.id);
      if (!state || interaction.user.id !== state.turno) {
        return interaction.reply({ content: "❌ Não é sua vez ou sessão expirada.", ephemeral: true });
      }

      const mapa = interaction.customId.replace("pb_", "");
      state.pool = state.pool.filter(m => m !== mapa);

      if (state.bans.length < 4) state.bans.push(mapa);
      else state.picks.push(mapa);

      state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
      await interaction.deferUpdate();

      if (state.bans.length < 4 || state.picks.length < 2) {
        return sendMapButtons(interaction.channel, state);
      }

      // FINALIZAÇÃO MD3
      const decisivo = state.pool[0];
      const embedFinal = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🗺️ Resultado Pick/Ban BSS")
        .addFields(
          { name: "❌ Bans", value: state.bans.join("\n"), inline: true },
          { name: "✅ Picks", value: state.picks.join("\n"), inline: true },
          { name: "🎯 Decisivo", value: `${decisivo}\n(Vencedor da faca escolhe o lado)` }
        );

      await interaction.channel.send({ embeds: [embedFinal] });
      const canalLogs = await interaction.client.channels.fetch(IDS.PICKBAN);
      if (canalLogs) canalLogs.send({ embeds: [embedFinal] });
      activePickBans.delete(interaction.channel.id);
    }
    
    // --- 4. CANCELAR MATCH (ADMIN ONLY) ---
    if (interaction.customId === "bss_admin_cancel") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        await interaction.reply("⚠️ Cancelando partida e fechando canal...");
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  });
};

function sendMapButtons(channel, state) {
  const fase = state.bans.length < 4 ? "BAN" : "PICK";
  const rows = [];
  let currentRow = new ActionRowBuilder();

  state.pool.forEach((mapa, index) => {
    if (index > 0 && index % 4 === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`pb_${mapa}`)
        .setLabel(`${fase === "BAN" ? "BANIR" : "PICK"} ${mapa}`)
        .setStyle(fase === "BAN" ? ButtonStyle.Danger : ButtonStyle.Success)
    );
  });
  rows.push(currentRow);

  channel.send({
    content: `🎮 Vez de <@${state.turno}> — **${fase}**`,
    components: rows
  });
}
