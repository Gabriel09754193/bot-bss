const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

/* =========================
   CONFIGURAÇÕES FIXAS (BSS)
========================= */
const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
  PICKBAN: "1464649761213780149",
  RESULTADOS: "1463260797604987014",
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

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Disponibilidade da equipe?**"];
    let respostas = [];
    let etapa = 0;

    await message.reply("⚔️ **BSS | Solicitação de Amistoso**\nFormato disponível: **MD3 (Melhor de 3)**");
    const coletor = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, max: 2 });
    await message.channel.send(perguntas[etapa]);

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      etapa++;
      if (etapa < 2) await message.channel.send(perguntas[etapa]);
    });

    coletor.on("end", async () => {
      if (respostas.length < 2) return;
      const [nomeA, disp] = respostas;
      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .setThumbnail("https://i.imgur.com/8E9X9ZQ.png") // Coloque a logo da BSS aqui
        .addFields(
          { name: "🛡️ Time Solicitante", value: `**${nomeA}**`, inline: true },
          { name: "🎮 IGL", value: `<@${message.author.id}>`, inline: true },
          { name: "📅 Disponibilidade", value: `\`${disp}\`` },
          { name: "⚠️ Aviso", value: "Aceite apenas se for jogar a partida • Formato **MD3**" }
        )
        .setFooter({ text: `ID:${message.author.id} • Base Strikes Series` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Match").setStyle(ButtonStyle.Success)
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
      await message.channel.send("✅ **Solicitação enviada com sucesso!**");
    });
  },
};

module.exports.setupPickBan = (client) => {
  client.on("interactionCreate", async (interaction) => {
    
    // --- 1. BOTÕES ---
    if (interaction.isButton()) {
      const state = activePickBans.get(interaction.channel.id);

      if (interaction.customId === "bss_match_aceitar") {
        const iglAId = interaction.message.embeds[0].footer.text.split("ID:")[1].split(" ")[0];
        const nomeA = interaction.message.embeds[0].fields[0].value.replace(/\*/g, "");
        if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });

        const canal = await interaction.guild.channels.create({
          name: `match-${nomeA}-vs-time-b`,
          parent: IDS.CATEGORIA_MATCH,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          ],
        });

        await canal.send(`🛡️ <@${interaction.user.id}>, **qual o nome da sua equipe?**`);
        const col = canal.createMessageCollector({ filter: (m) => m.author.id === interaction.user.id, max: 1 });
        
        col.on("collect", async (m) => {
          const embed = new EmbedBuilder()
            .setColor("#1E90FF")
            .setTitle("🤝 BSS | Amistoso Privado")
            .setThumbnail("https://i.imgur.com/8E9X9ZQ.png")
            .setDescription("Bem-vindos! Este chat é destinado para a marcação e combinação da partida.\n\n⚠️ **O Pick/Ban deve ser iniciado por um ADMIN.**")
            .addFields(
              { name: "🛡️ Time A", value: nomeA, inline: true }, { name: "🛡️ Time B", value: m.content, inline: true },
              { name: "🎮 IGL A", value: `<@${iglAId}>`, inline: true }, { name: "🎮 IGL B", value: `<@${interaction.user.id}>`, inline: true },
              { name: "📋 Formato", value: "MD3 (Melhor de 3)", inline: false }
            );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("pb_start").setLabel("Iniciar Pick/Ban").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("match_result").setLabel("Enviar Resultado").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("match_cancel").setLabel("Cancelar Match").setStyle(ButtonStyle.Danger)
          );
          await canal.send({ embeds: [embed], components: [row] });
        });
        await interaction.reply({ content: "✅ Chat criado!", ephemeral: true });
      }

      // INICIAR PICK/BAN
      if (interaction.customId === "pb_start") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Apenas admins.", ephemeral: true });
        
        const stateData = {
          iglA: interaction.message.embeds[0].fields[2].value.match(/\d+/)[0],
          iglB: interaction.message.embeds[0].fields[3].value.match(/\d+/)[0],
          timeA: interaction.message.embeds[0].fields[0].value,
          timeB: interaction.message.embeds[0].fields[1].value,
          bans: [], picks: [], pool: [...MAP_POOL], logs: [], statusLado: false, decisivo: ""
        };
        stateData.turno = Math.random() < 0.5 ? stateData.iglA : stateData.iglB;
        activePickBans.set(interaction.channel.id, stateData);
        
        await interaction.update({ content: "🎲 **Sorteio realizado!** Iniciando vetos...", components: interaction.message.components });
        return refreshPB(interaction.channel, stateData);
      }

      // LADO (CT/TR)
      if (interaction.customId.startsWith("side_")) {
        if (!state || interaction.user.id !== state.turno) return interaction.reply({ content: "❌ Não é sua vez!", ephemeral: true });
        const lado = interaction.customId.split("_")[1];
        const emoji = lado === "CT" ? "👮" : "🧨";
        state.logs.push(`${emoji} <@${interaction.user.id}> escolheu começar de **${lado}** no mapa **${state.picks[state.picks.length-1]}**`);
        state.statusLado = false;
        state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        await interaction.deferUpdate();
        return checkFinish(interaction, state);
      }

      // VETO/PICK MAPA
      if (interaction.customId.startsWith("pb_")) {
        if (!state || interaction.user.id !== state.turno || state.statusLado) return;
        const mapa = interaction.customId.replace("pb_", "");
        state.pool = state.pool.filter(m => m !== mapa);

        if (state.bans.length < 4) {
          state.bans.push(mapa);
          state.logs.push(`❌ <@${interaction.user.id}> baniu **${mapa}**`);
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        } else {
          state.picks.push(mapa);
          state.logs.push(`✅ <@${interaction.user.id}> pickou **${mapa}**`);
          state.statusLado = true; // Agora o OUTRO escolhe o lado
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        }
        await interaction.deferUpdate();
        return checkFinish(interaction, state);
      }

      // RESULTADO
      if (interaction.customId === "match_result") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const modal = new ModalBuilder().setCustomId("modal_resultado").setTitle("🏆 Relatório de Partida BSS");
        const i1 = new TextInputBuilder().setCustomId("res_vencedor").setLabel("EQUIPE VENCEDORA").setStyle(TextInputStyle.Short).setRequired(true);
        const i2 = new TextInputBuilder().setCustomId("res_placar").setLabel("PLACAR (EX: MAPA 1: 13-5 / MAPA 2: 13-10)").setStyle(TextInputStyle.Paragraph).setRequired(true);
        const i3 = new TextInputBuilder().setCustomId("res_stats").setLabel("ELIMINAÇÕES GERAIS / KD EQUIPE").setStyle(TextInputStyle.Short).setRequired(true);
        const i4 = new TextInputBuilder().setCustomId("res_mvp").setLabel("MVP DA PARTIDA").setStyle(TextInputStyle.Short).setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(i1), new ActionRowBuilder().addComponents(i2), new ActionRowBuilder().addComponents(i3), new ActionRowBuilder().addComponents(i4));
        await interaction.showModal(modal);
      }

      if (interaction.customId === "match_cancel") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        await interaction.reply("⚠️ **Cancelando match...** O canal será deletado em 5 segundos.");
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }
    }

    // --- 2. MODAL SUBMIT ---
    if (interaction.isModalSubmit() && interaction.customId === "modal_resultado") {
      const vencedor = interaction.fields.getTextInputValue("res_vencedor");
      const placares = interaction.fields.getTextInputValue("res_placar");
      const stats = interaction.fields.getTextInputValue("res_stats");
      const mvp = interaction.fields.getTextInputValue("res_mvp");

      const embedRes = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("🏆 BSS | RESULTADO DO CONFRONTO")
        .setThumbnail("https://i.imgur.com/8E9X9ZQ.png")
        .setDescription(`A equipe **${vencedor}** levou a melhor contra seu adversário! Confira as estatísticas:`)
        .addFields(
          { name: "📍 Placar por Mapas", value: `\`\`\`${placares}\`\`\`` },
          { name: "💀 Estatísticas de Equipe", value: stats, inline: true },
          { name: "🌟 MVP da Partida", value: mvp, inline: true }
        )
        .setFooter({ text: "Liga Base Strikes Series • Finalizado" })
        .setTimestamp();

      const canalRes = await interaction.client.channels.fetch(IDS.RESULTADOS);
      await canalRes.send({ embeds: [embedRes] });
      await interaction.reply("✅ **Resultado publicado com sucesso!** Deletando canal em 10 segundos.");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
    }
  });
};

/* =========================
   FUNÇÕES AUXILIARES
========================= */
async function checkFinish(interaction, state) {
  if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
    state.decisivo = state.pool[0];
    const ladoAuto = Math.random() < 0.5 ? "CT" : "TR";
    const emojiAuto = ladoAuto === "CT" ? "👮" : "🧨";
    
    state.logs.push(`🎯 **Mapa Decisivo:** ${state.decisivo}`);
    state.logs.push(`${emojiAuto} Sorteio automático: **<@${state.turno}>** começa de **${ladoAuto}** no decisivo.`);

    const embedFinal = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🗺️ Pick/Ban Finalizado | MD3")
      .setThumbnail("https://i.imgur.com/8E9X9ZQ.png")
      .addFields(
        { name: "✅ Picks", value: `1. ${state.picks[0]}\n2. ${state.picks[1]}`, inline: true },
        { name: "🎯 Decisivo", value: state.decisivo, inline: true },
        { name: "📜 Histórico de Ações", value: state.logs.join("\n") }
      )
      .setFooter({ text: "BSS Match System" });

    await interaction.channel.send({ content: "🏆 **Tudo pronto para o combate!**", embeds: [embedFinal] });
    const canalLog = await interaction.client.channels.fetch(IDS.PICKBAN);
    canalLog.send({ embeds: [embedFinal] });
    activePickBans.delete(interaction.channel.id);
  } else {
    refreshPB(interaction.channel, state);
  }
}

function refreshPB(channel, state) {
  const fase = state.statusLado ? "LADO" : (state.bans.length < 4 ? "BAN" : "PICK");
  const embed = new EmbedBuilder()
    .setTitle("🗺️ BSS | Sistema de Pick/Ban")
    .setColor(fase === "BAN" ? "#ED4245" : (fase === "PICK" ? "#57F287" : "#FEE75C"))
    .setDescription(`Vez de: <@${state.turno}>\nAção Atual: **${fase}**`)
    .addFields({ name: "📝 Log de Escolhas", value: state.logs.length > 0 ? state.logs.join("\n") : "_Aguardando primeira ação..._" })
    .setFooter({ text: "MD3: 4 Bans ➔ 2 Picks ➔ 1 Decisivo" });

  const rows = [];
  if (state.statusLado) {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("side_CT").setLabel("Começar de CT").setStyle(ButtonStyle.Secondary).setEmoji("👮"),
      new ButtonBuilder().setCustomId("side_TR").setLabel("Começar de TR").setStyle(ButtonStyle.Primary).setEmoji("🧨")
    ));
  } else {
    let row = new ActionRowBuilder();
    state.pool.forEach((m, i) => {
      if (i > 0 && i % 4 === 0) { rows.push(row); row = new ActionRowBuilder(); }
      row.addComponents(new ButtonBuilder().setCustomId(`pb_${m}`).setLabel(m).setStyle(fase === "BAN" ? ButtonStyle.Danger : ButtonStyle.Success));
    });
    rows.push(row);
  }
  channel.send({ embeds: [embed], components: rows });
}
