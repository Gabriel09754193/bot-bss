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

/* =========================
   CONFIGURAÇÕES FIXAS (BSS)
========================= */
const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
  PICKBAN: "1464649761213780149",
  RESULTADOS: "1463260797604987014",
  AMISTOSOS: "1466989903232499712",
  CATEGORIA_MATCH: "1463562210591637605",
  CARGO_IGL: "1463258074310508765", 
};

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

module.exports = {
  nome: "match",
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !message.member.roles.cache.has(IDS.CARGO_IGL)) {
      return message.reply("❌ Erro: Comando restrito a Administradores ou IGLs.");
    }

    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Disponibilidade da equipe?**"];
    let respostas = [];
    let msgsColeta = [];

    const msgBoasVindas = await message.channel.send("✨ **BSS Match** | Iniciando...");
    msgsColeta.push(msgBoasVindas);

    // Coletor sem tempo de expiração curto para não bugar
    const coletor = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, max: 2 });
    const p1 = await message.channel.send(perguntas[0]);
    msgsColeta.push(p1);

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      msgsColeta.push(m);
      if (respostas.length < 2) {
        const p2 = await message.channel.send(perguntas[1]);
        msgsColeta.push(p2);
      }
    });

    coletor.on("end", async () => {
      msgsColeta.forEach(m => m.delete().catch(() => {}));
      if (respostas.length < 2) return;

      const [nomeA, disp] = respostas;
      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 NOVO DESAFIO DISPONÍVEL")
        .addFields(
          { name: "🛡️ Equipe", value: `**${nomeA}**`, inline: true },
          { name: "🎮 IGL", value: `<@${message.author.id}>`, inline: true },
          { name: "📅 Disponibilidade", value: `\`${disp}\`` }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("ACEITAR DESAFIO").setStyle(ButtonStyle.Success).setEmoji("⚔️")
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
};

module.exports.setupPickBan = (client) => {
  client.on("interactionCreate", async (interaction) => {
    const state = activePickBans.get(interaction.channel.id);

    if (interaction.isButton()) {
      
      // BLOQUEIO DE SEGURANÇA: Apenas ADMINS usam botões de controle
      const botoesControle = ["pb_start", "match_result", "match_cancel"];
      if (botoesControle.includes(interaction.customId)) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "🚫 **Acesso Negado:** Apenas Administradores da BSS podem usar estes botões.", ephemeral: true });
        }
      }

      if (interaction.customId === "bss_match_aceitar") {
        const iglAId = interaction.message.embeds[0].fields[1].value.match(/\d+/)[0];
        const nomeA = interaction.message.embeds[0].fields[0].value.replace(/\*/g, "");

        if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });

        const embedAceito = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor("#2F3136").setTitle("✅ AMISTOSO CONFIRMADO").setFields(
                { name: "🛡️ Time A", value: nomeA, inline: true },
                { name: "⚔️ Desafiante", value: `<@${interaction.user.id}>`, inline: true }
            );
        await interaction.update({ embeds: [embedAceito], components: [] });

        const canal = await interaction.guild.channels.create({
          name: `⚔️┃${nomeA}-vs-desafio`,
          parent: IDS.CATEGORIA_MATCH,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          ],
        });

        const askB = await canal.send(`🛡️ <@${interaction.user.id}>, **qual o nome da sua equipe?**`);
        const col = canal.createMessageCollector({ filter: (m) => m.author.id === interaction.user.id, max: 1 });
        
        col.on("collect", async (m) => {
          const nomeB = m.content;
          m.delete().catch(() => {}); askB.delete().catch(() => {});
          
          const embedPrivado = new EmbedBuilder()
            .setColor("#1E90FF")
            .setTitle("🤝 BSS | AMISTOSO CONFIRMADO")
            .setDescription("❗ **AVISO:** Os botões abaixo são de uso exclusivo da **Administração**. Os IGLs devem apenas realizar os vetos/picks quando solicitado.")
            .addFields(
              { name: "🏠 Time A", value: `**${nomeA}**`, inline: true }, { name: "🚀 Time B", value: `**${nomeB}**`, inline: true },
              { name: "👑 IGL A", value: `<@${iglAId}>`, inline: true }, { name: "👑 IGL B", value: `<@${interaction.user.id}>`, inline: true }
            )
            .setFooter({ text: "Botões permanentes | Base Strike Series" });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("pb_start").setLabel("INICIAR PICK/BAN").setStyle(ButtonStyle.Primary).setEmoji("🗺️"),
            new ButtonBuilder().setCustomId("match_result").setLabel("RESULTADO").setStyle(ButtonStyle.Success).setEmoji("🏆"),
            new ButtonBuilder().setCustomId("match_cancel").setLabel("CANCELAR").setStyle(ButtonStyle.Danger).setEmoji("✖️")
          );
          await canal.send({ content: `<@${iglAId}> <@${interaction.user.id}>`, embeds: [embedPrivado], components: [row] });
        });
      }

      // INICIAR PICK BAN
      if (interaction.customId === "pb_start") {
        const emb = interaction.message.embeds[0];
        const stateData = {
          iglA: emb.fields[2].value.match(/\d+/)[0], iglB: emb.fields[3].value.match(/\d+/)[0],
          timeA: emb.fields[0].value, timeB: emb.fields[1].value,
          bans: [], picks: [], pool: [...MAP_POOL], logs: [], statusLado: false, ultimoPick: ""
        };
        stateData.turno = Math.random() < 0.5 ? stateData.iglA : stateData.iglB;
        activePickBans.set(interaction.channel.id, stateData);
        
        const newRow = ActionRowBuilder.from(interaction.message.components[0]);
        newRow.components.shift(); // Remove o botão de Iniciar, mantém Resultado e Cancelar
        await interaction.update({ components: [newRow] });

        return refreshPB(interaction.channel, stateData);
      }

      // LÓGICA DE TURNOS (PICK/BAN)
      if (interaction.customId.startsWith("pb_")) {
        if (!state || interaction.user.id !== state.turno || state.statusLado) return;
        const mapa = interaction.customId.replace("pb_", "");
        state.pool = state.pool.filter(m => m !== mapa);
        if (state.bans.length < 4) {
          state.bans.push(mapa);
          state.logs.push(`🔴 **VETO:** <@${interaction.user.id}> removeu \`${mapa}\``);
          state.turno = (state.turno === state.iglA ? state.iglB : state.iglA);
        } else {
          state.picks.push(mapa);
          state.logs.push(`🟢 **PICK:** <@${interaction.user.id}> escolheu \`${mapa}\``);
          state.ultimoPick = interaction.user.id;
          state.statusLado = true;
          state.turno = (interaction.user.id === state.iglA ? state.iglB : state.iglA);
        }
        await interaction.deferUpdate();
        return checkFinish(interaction, state);
      }

      if (interaction.customId.startsWith("side_")) {
        if (!state || interaction.user.id !== state.turno || !state.statusLado) return;
        const lado = interaction.customId.split("_")[1];
        state.logs.push(`${lado === "CT" ? "👮" : "🧨"} **LADO:** <@${interaction.user.id}> começou de **${lado}** em \`${state.picks[state.picks.length-1]}\``);
        state.statusLado = false;
        state.turno = (state.ultimoPick === state.iglA ? state.iglB : state.iglA);
        await interaction.deferUpdate();
        return checkFinish(interaction, state);
      }

      // RESULTADO
      if (interaction.customId === "match_result") {
        const modal = new ModalBuilder().setCustomId("modal_resultado").setTitle("🏆 Relatório Premium BSS");
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("v").setLabel("EQUIPE VENCEDORA").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("p").setLabel("EQUIPE PERDEDORA").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("pl").setLabel("PLACAR (EX: 13-05 / 13-10)").setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("mvp").setLabel("MVP E DESTAQUE").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("DATA OU LINK DA PRINT/DEMO").setStyle(TextInputStyle.Short).setRequired(false))
        );
        await interaction.showModal(modal);
      }

      if (interaction.customId === "match_cancel") {
        await interaction.reply("⚠️ Canal será deletado em 5 segundos.");
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === "modal_resultado") {
      const v = interaction.fields.getTextInputValue("v");
      const p = interaction.fields.getTextInputValue("p");
      const pl = interaction.fields.getTextInputValue("pl");
      const mvp = interaction.fields.getTextInputValue("mvp");
      const extra = interaction.fields.getTextInputValue("extra") || "Não informado";

      const embedRes = new EmbedBuilder()
        .setColor("#00FF00").setTitle("🏆 RESULTADO DO CONFRONTO | BSS")
        .setDescription(`A equipe **${v}** superou a equipe **${p}**!`)
        .addFields(
            { name: "📍 Placar Detalhado", value: `\`\`\`arm\n${pl}\n\`\`\`` },
            { name: "🌟 MVP da Partida", value: `> ${mvp}`, inline: true },
            { name: "📅 Info Extra", value: `> ${extra}`, inline: true }
        ).setTimestamp();

      const canalRes = await interaction.client.channels.fetch(IDS.RESULTADOS);
      await canalRes.send({ embeds: [embedRes] });
      await interaction.reply("✅ Relatório enviado!");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  });
};

function refreshPB(channel, state) {
  const fase = state.statusLado ? "LADO" : (state.bans.length < 4 ? "VETO" : "PICK");
  const embed = new EmbedBuilder()
    .setTitle("🗺️ SISTEMA DE PICK/BAN | BSS")
    .setColor(state.statusLado ? "#FEE75C" : (state.bans.length < 4 ? "#ED4245" : "#57F287"))
    .addFields(
        { name: "👤 Vez de:", value: `<@${state.turno}>`, inline: true },
        { name: "🎯 Ação:", value: `\`${fase}\``, inline: true },
        { name: "📜 Histórico Recente", value: state.logs.length > 0 ? state.logs.join("\n") : "_Aguardando vetos..._" }
    );

  const rows = [];
  if (state.statusLado) {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("side_CT").setLabel("COMEÇAR DE CT").setStyle(ButtonStyle.Secondary).setEmoji("👮"),
      new ButtonBuilder().setCustomId("side_TR").setLabel("COMEÇAR DE TR").setStyle(ButtonStyle.Primary).setEmoji("🧨")
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

async function checkFinish(interaction, state) {
    if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
      const decisivo = state.pool[0];
      const ladoAuto = Math.random() < 0.5 ? "CT" : "TR";
      state.logs.push(`🎯 **DECISIVO:** \`${decisivo}\` (Lado: <@${state.turno}> de **${ladoAuto}**)`);
  
      const embedFinal = new EmbedBuilder()
        .setColor("#5865F2").setTitle("🗺️ VETOS FINALIZADOS").addFields({ name: "✅ Mapas", value: `1. ${state.picks[0]}\n2. ${state.picks[1]}\n3. ${decisivo}` });
  
      await interaction.channel.send({ embeds: [embedFinal] });
      const amiChan = await interaction.client.channels.fetch(IDS.AMISTOSOS);
      amiChan.send({ 
          content: "🔥 **PARTIDA CONFIRMADA!**", 
          embeds: [new EmbedBuilder().setColor("#FF0000").setTitle(`⚔️ ${state.timeA} vs ${state.timeB}`).setDescription(`📍 **Mapas:**\n\`1.\` ${state.picks[0]}\n\`2.\` ${state.picks[1]}\n\`3.\` ${decisivo}`)] 
      });
      activePickBans.delete(interaction.channel.id);
    } else {
      refreshPB(interaction.channel, state);
    }
}
