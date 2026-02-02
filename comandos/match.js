const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
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
};

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    // Limpeza automática do canal #matchs
    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Disponibilidade da equipe?**"];
    let respostas = [];
    let mensagensParaApagar = [];

    const msgBoasVindas = await message.channel.send("⚔️ **BSS | Iniciando Solicitação de Amistoso (MD3)...**");
    mensagensParaApagar.push(msgBoasVindas);

    const coletor = message.channel.createMessageCollector({ 
      filter: (m) => m.author.id === message.author.id, 
      max: 2,
      time: 60000 
    });

    const perguntaInicial = await message.channel.send(perguntas[0]);
    mensagensParaApagar.push(perguntaInicial);

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      mensagensParaApagar.push(m);
      if (respostas.length < 2) {
        const prox = await message.channel.send(perguntas[respostas.length]);
        mensagensParaApagar.push(prox);
      }
    });

    coletor.on("end", async () => {
      // Limpa o chat #matchs
      mensagensParaApagar.forEach(msg => msg.delete().catch(() => {}));

      if (respostas.length < 2) return;

      const [nomeA, disp] = respostas;
      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .addFields(
          { name: "🛡️ Time", value: `**${nomeA}**`, inline: true },
          { name: "📅 Disponibilidade", value: `\`${disp}\``, inline: true }
        )
        .setFooter({ text: `ID:${message.author.id} | Pendente` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Match").setStyle(ButtonStyle.Success)
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
};

/* =========================
   FUNÇÕES DE APOIO (LÓGICA)
========================= */

// Função que atualiza o painel de Pick/Ban no chat
async function refreshPB(channel, state) {
  const fase = state.statusLado ? "ESCOLHER LADO" : (state.bans.length < 4 ? "BANIR MAPA" : "PICKAR MAPA");
  
  const embed = new EmbedBuilder()
    .setTitle("🗺️ Painel de Pick/Ban BSS")
    .setColor(state.statusLado ? "#FEE75C" : (state.bans.length < 4 ? "#ED4245" : "#57F287"))
    .setDescription(`👤 **Vez de:** <@${state.turno}>\n🎯 **Ação:** \`${fase}\``)
    .addFields({ name: "📜 Histórico", value: state.logs.length > 0 ? state.logs.join("\n") : "_Aguardando..._" });

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

  // Se já existir uma mensagem de PB, edita. Se não, envia uma nova.
  if (state.lastMsgId) {
    const msg = await channel.messages.fetch(state.lastMsgId).catch(() => null);
    if (msg) return msg.edit({ embeds: [embed], components: rows });
  }
  const sent = await channel.send({ embeds: [embed], components: rows });
  state.lastMsgId = sent.id;
}

// Função que verifica se o Pick/Ban acabou
async function checkFinish(interaction, state, client) {
  if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
    const decisivo = state.pool[0];
    
    const embedFinal = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🏁 Pick/Ban Finalizado")
      .addFields(
        { name: "✅ Mapas", value: `1. ${state.picks[0]}\n2. ${state.picks[1]}\n3. ${decisivo} (Decisivo)` }
      );

    await interaction.channel.send({ content: "🏆 **Confronto definido!**", embeds: [embedFinal] });
    
    // Anúncio no canal de Amistosos
    const amiChan = await client.channels.fetch(IDS.AMISTOSOS);
    amiChan.send({ content: `🔥 **Novo Match:** ${state.timeA} vs ${state.timeB}`, embeds: [embedFinal] });

    activePickBans.delete(interaction.channel.id);
  } else {
    await refreshPB(interaction.channel, state);
  }
}

// Exportando as funções e o Map para o seu index.js usar
module.exports.activePickBans = activePickBans;
module.exports.refreshPB = refreshPB;
module.exports.checkFinish = checkFinish;
module.exports.IDS = IDS;
module.exports.MAP_POOL = MAP_POOL;
