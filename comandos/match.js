const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
  PICKBAN: "1464649761213780149",
  RESULTADOS: "1463260797604987014",
  AMISTOSOS: "1466989903232499712",
  CATEGORIA: "1463562210591637605"
};

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

module.exports = {
  nome: "match",
  async execute(message, args, client) {
    // APENAS IGLs ou ADMINS (Pode ajustar para o ID do cargo IGL aqui)
    // if (!message.member.roles.cache.has("ID_DO_CARGO_IGL")) return;

    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Qual a disponibilidade (ex: Sábado 19h)?**"];
    let respostas = [];
    const filter = m => m.author.id === message.author.id;
    const coletor = message.channel.createMessageCollector({ filter, max: 2, time: 60000 });

    const msgPergunta = await message.channel.send(`👋 <@${message.author.id}>, ${perguntas[0]}`);

    coletor.on('collect', async m => {
      respostas.push(m.content);
      m.delete().catch(() => {});
      if (respostas.length < 2) msgPergunta.edit(`📅 ${perguntas[1]}`);
    });

    coletor.on('end', async () => {
      msgPergunta.delete().catch(() => {});
      if (respostas.length < 2) return;

      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);
      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setAuthor({ name: "BSS | SOLICITAÇÃO DE AMISTOSO", iconURL: client.user.displayAvatarURL() })
        .addFields(
          { name: "🛡️ Equipe", value: `**${respostas[0]}**`, inline: true },
          { name: "📅 Disponibilidade", value: `\`${respostas[1]}\``, inline: true }
        )
        .setFooter({ text: `ID:${message.author.id}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Desafio").setStyle(ButtonStyle.Success).setEmoji("⚔️")
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
  
  // Exportamos as funções para o index.js usar
  activePickBans,
  IDS,
  MAP_POOL,
  refreshPB: async function(channel, state) {
    const fase = state.statusLado ? "ESCOLHER LADO" : (state.bans.length < 4 ? "BANIR" : "PICKAR MAPA");
    const embed = new EmbedBuilder().setTitle("🗺️ SISTEMA DE PICK/BAN BSS").setColor("#2b2d31")
      .setDescription(`👤 **Turno de:** <@${state.turno}>\n🎯 **Ação:** \`${fase}\`\n\n**HISTÓRICO:**\n${state.logs.join("\n") || "_Aguardando ação..._"}`);
    
    const rows = [];
    let row = new ActionRowBuilder();

    if (state.statusLado) {
      row.addComponents(
        new ButtonBuilder().setCustomId("side_CT").setLabel("Começar de CT").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("side_TR").setLabel("Começar de TR").setStyle(ButtonStyle.Primary)
      );
      rows.push(row);
    } else {
      state.pool.forEach((m, i) => {
        if (i > 0 && i % 4 === 0) { rows.push(row); row = new ActionRowBuilder(); }
        row.addComponents(new ButtonBuilder().setCustomId(`pb_${m}`).setLabel(m).setStyle(state.bans.length < 4 ? ButtonStyle.Danger : ButtonStyle.Success));
      });
      rows.push(row);
    }

    if (state.lastMsgId) {
      const old = await channel.messages.fetch(state.lastMsgId).catch(() => null);
      if (old) await old.delete().catch(() => {});
    }
    const msg = await channel.send({ embeds: [embed], components: rows });
    state.lastMsgId = msg.id;
  },

  checkFinish: async function(interaction, state, client) {
    if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
      const decisivo = state.pool[0];
      const embedResumo = new EmbedBuilder().setTitle("⚔️ CONFRONTO DEFINIDO").setColor("#5865F2")
        .addFields({ name: "🗺️ Mapas", value: `1. **${state.picks[0]}**\n2. **${state.picks[1]}**\n3. **${decisivo}** (Decisivo)` });
      
      await interaction.channel.send({ embeds: [embedResumo] });
      const c1 = await client.channels.fetch(IDS.PICKBAN); if (c1) c1.send({ embeds: [new EmbedBuilder().setTitle("📋 LOGS").setDescription(state.logs.join("\n"))] });
      const c2 = await client.channels.fetch(IDS.AMISTOSOS); if (c2) c2.send({ embeds: [embedResumo] });
      activePickBans.delete(interaction.channel.id);
    } else {
      this.refreshPB(interaction.channel, state);
    }
  }
};
