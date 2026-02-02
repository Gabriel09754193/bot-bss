const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");

// Configurações de IDs
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
    
    const filter = m => m.author.id === message.author.id;
    const coletor = message.channel.createMessageCollector({ filter, max: 2, time: 60000 });

    const msgPergunta = await message.channel.send(perguntas[0]);

    coletor.on('collect', async m => {
      respostas.push(m.content);
      m.delete().catch(() => {});
      if (respostas.length < 2) {
        msgPergunta.edit(perguntas[1]);
      }
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
};

// --- FUNÇÃO DE ATUALIZAÇÃO DO PAINEL ---
async function refreshPB(channel, state) {
  const fase = state.statusLado ? "ESCOLHER LADO" : (state.bans.length < 4 ? "BANIR" : "PICKAR");
  
  const embed = new EmbedBuilder()
    .setTitle("🗺️ Painel Pick/Ban BSS")
    .setColor(state.statusLado ? "#FEE75C" : (state.bans.length < 4 ? "#ED4245" : "#57F287"))
    .setDescription(`👤 Vez de: <@${state.turno}>\n🎯 Ação: **${fase}**`)
    .addFields({ name: "📜 Histórico", value: state.logs.join("\n") || "Iniciando..." })
    .setTimestamp();

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

  // Se já existir mensagem, edita. Senão, envia nova e salva o ID.
  if (state.lastMsgId) {
    const msg = await channel.messages.fetch(state.lastMsgId).catch(() => null);
    if (msg) return msg.edit({ embeds: [embed], components: rows });
  }
  const sent = await channel.send({ embeds: [embed], components: rows });
  state.lastMsgId = sent.id;
}

// Exportando tudo para o arquivo principal
module.exports.activePickBans = activePickBans;
module.exports.refreshPB = refreshPB;
module.exports.IDS = IDS;
module.exports.MAP_POOL = MAP_POOL;
