const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

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
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Qual a disponibilidade?**"];
    let respostas = [];
    const filter = m => m.author.id === message.author.id;
    const coletor = message.channel.createMessageCollector({ filter, max: 2, time: 60000 });

    const msgPergunta = await message.channel.send(perguntas[0]);

    coletor.on('collect', async m => {
      respostas.push(m.content);
      m.delete().catch(() => {});
      if (respostas.length < 2) msgPergunta.edit(perguntas[1]);
    });

    coletor.on('end', async () => {
      msgPergunta.delete().catch(() => {});
      if (respostas.length < 2) return;

      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);
      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("⚔️ BSS | NOVO DESAFIO")
        .addFields(
          { name: "🛡️ Equipe", value: respostas[0], inline: true },
          { name: "📅 Horário", value: respostas[1], inline: true }
        )
        .setFooter({ text: `ID:${message.author.id}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Desafio").setStyle(ButtonStyle.Success)
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },

  activePickBans,
  IDS,
  MAP_POOL,

  refreshPB: async function(channel, state) {
    const fase = state.statusLado ? "ESCOLHER LADO" : (state.bans.length < 4 ? "BANIR" : "PICKAR");
    const embed = new EmbedBuilder().setTitle("🗺️ PAINEL PICK/BAN BSS").setColor("#2b2d31")
      .setDescription(`👤 Vez de: <@${state.turno}>\n🎯 Ação: **${fase}**\n\n**LOGS:**\n${state.logs.join("\n") || "..."}`);
    
    const rows = [];
    let row = new ActionRowBuilder();
    if (state.statusLado) {
      row.addComponents(
        new ButtonBuilder().setCustomId("side_CT").setLabel("CT").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("side_TR").setLabel("TR").setStyle(ButtonStyle.Primary)
      );
      rows.push(row);
    } else {
      state.pool.slice(0, 4).forEach(m => row.addComponents(new ButtonBuilder().setCustomId(`pb_${m}`).setLabel(m).setStyle(state.bans.length < 4 ? ButtonStyle.Danger : ButtonStyle.Success)));
      rows.push(row);
    }

    if (state.lastMsgId) {
      const old = await channel.messages.fetch(state.lastMsgId).catch(() => null);
      if (old) old.delete().catch(() => {});
    }
    const msg = await channel.send({ embeds: [embed], components: rows });
    state.lastMsgId = msg.id;
  },

  checkFinish: async function(interaction, state, client) {
    if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
      const decisivo = state.pool[0];
      
      const embedFinal = new EmbedBuilder()
        .setTitle("🎮 CONFRONTO DEFINIDO | BSS PREMIER")
        .setColor("#5865F2")
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(`As equipes já estão prontas para o combate!`)
        .addFields(
          { name: "🏠 Equipe Casa", value: `**${state.timeA}**`, inline: true },
          { name: "🚀 Equipe Visitante", value: `**${state.timeB}**`, inline: true },
          { name: "📍 Mapas Oficiais", value: `1️⃣ **${state.picks[0]}**\n2️⃣ **${state.picks[1]}**\n3️⃣ **${decisivo}** (Decisivo)` }
        )
        .setFooter({ text: "Boa sorte aos competidores! | BSS E-sports" })
        .setTimestamp();

      await interaction.channel.send({ content: "🔥 **CONFRONTO CONFIRMADO!**", embeds: [embedFinal] });
      
      const c1 = await client.channels.fetch(IDS.PICKBAN); 
      if (c1) c1.send({ embeds: [new EmbedBuilder().setTitle(`📋 LOGS: ${state.timeA} vs ${state.timeB}`).setDescription(state.logs.join("\n"))] });
      
      const c2 = await client.channels.fetch(IDS.AMISTOSOS); 
      if (c2) c2.send({ embeds: [embedFinal] });

      activePickBans.delete(interaction.channel.id);
    } else {
      this.refreshPB(interaction.channel, state);
    }
  }
};
