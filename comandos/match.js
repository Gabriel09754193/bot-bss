const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

// Mantenha seus IDs aqui
const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
  AMISTOSOS: "1466989903232499712",
  CATEGORIA_MATCH: "1463562210591637605",
};

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

module.exports = {
  nome: "match",
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    
    // Deleta o comando do admin para não poluir
    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Qual a disponibilidade?**"];
    let respostas = [];
    
    const filter = m => m.author.id === message.author.id;
    const coletor = message.channel.createMessageCollector({ filter, max: 2, time: 60000 });

    const msgStatus = await message.channel.send(perguntas[0]);

    coletor.on('collect', m => {
      respostas.push(m.content);
      m.delete().catch(() => {});
      if (respostas.length < 2) msgStatus.edit(perguntas[1]);
    });

    coletor.on('end', async () => {
      msgStatus.delete().catch(() => {});
      if (respostas.length < 2) return;

      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);
      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .addFields(
          { name: "🛡️ Time", value: respostas[0], inline: true },
          { name: "📅 Disponibilidade", value: respostas[1], inline: true }
        )
        .setFooter({ text: `ID:${message.author.id} | Pendente` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Match").setStyle(ButtonStyle.Success)
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
};

// --- FUNÇÃO PARA ATUALIZAR O PAINEL DE PICK/BAN ---
async function refreshPB(channel, state) {
  const fase = state.statusLado ? "ESCOLHER LADO" : (state.bans.length < 4 ? "BANIR" : "PICKAR");
  
  const embed = new EmbedBuilder()
    .setTitle("🗺️ Painel Pick/Ban BSS")
    .setColor(state.statusLado ? "#FEE75C" : "#57F287")
    .setDescription(`👤 Vez de: <@${state.turno}>\n🎯 Ação: **${fase}**`)
    .addFields({ name: "📜 Histórico", value: state.logs.join("\n") || "Aguardando..." });

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

  // Edita a mensagem se ela existir, se não, envia nova
  if (state.lastMsgId) {
    const msg = await channel.messages.fetch(state.lastMsgId).catch(() => null);
    if (msg) return msg.edit({ embeds: [embed], components: rows });
  }
  const sent = await channel.send({ embeds: [embed], components: rows });
  state.lastMsgId = sent.id;
}

// Exportando para o index.js
module.exports.activePickBans = activePickBans;
module.exports.refreshPB = refreshPB;
module.exports.IDS = IDS;
module.exports.MAP_POOL = MAP_POOL;
