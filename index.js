const { 
    Client, GatewayIntentBits, Collection, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionsBitField 
} = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

const IDS = {
  PICKBAN: "1464649761213780149",
  RESULTADOS: "1463260797604987014",
  AMISTOSOS: "1466989903232499712",
  CATEGORIA: "1463562210591637605"
};

// Carregar Comandos
const commandFiles = fs.readdirSync("./comandos").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.nome, command);
}

client.once("ready", () => console.log(`🤖 BSS Bot Online: ${client.user.tag}`));

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(".")) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const command = client.commands.get(args.shift().toLowerCase());
  if (command) command.execute(message, args, client).catch(console.error);
});

/* ======================================================
    🔘 SISTEMA DE INTERAÇÕES (INDEX + LÓGICA)
   ====================================================== */
client.on("interactionCreate", async (interaction) => {
  const state = activePickBans.get(interaction.channel.id);

  if (interaction.isButton()) {
    
    // 1. ACEITAR DESAFIO
    if (interaction.customId === "bss_match_aceitar") {
      const iglAId = interaction.message.embeds[0].fields[1].value.match(/\d+/)[0];
      const nomeA = interaction.message.embeds[0].fields[0].value.replace(/\*/g, "");

      if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: `⚔️┃match-${nomeA}`,
        parent: IDS.CATEGORIA,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pb_start").setLabel("INICIAR PICK/BAN").setStyle(ButtonStyle.Primary).setEmoji("🗺️"),
        new ButtonBuilder().setCustomId("match_result").setLabel("RESULTADO").setStyle(ButtonStyle.Success).setEmoji("🏆"),
        new ButtonBuilder().setCustomId("match_cancel").setLabel("CANCELAR").setStyle(ButtonStyle.Danger).setEmoji("✖️")
      );

      await interaction.reply({ content: `✅ Canal Criado: ${channel}`, ephemeral: true });
      await channel.send({
        content: `🔔 <@${iglAId}> vs <@${interaction.user.id}>`,
        embeds: [new EmbedBuilder()
            .setTitle("🤝 CONFRONTO CONFIRMADO")
            .setDescription(`**Time A:** ${nomeA}\n**Time B:** Pendente\n\nAdmin, use os botões abaixo para gerenciar.`)
            .setColor("#1E90FF")],
        components: [row]
      });
    }

    // 2. BOTÃO RESULTADO (ABRIR MODAL)
    if (interaction.customId === "match_result") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "🚫 Só Admins.", ephemeral: true });
      
      const modal = new ModalBuilder().setCustomId("modal_bss_final").setTitle("🏆 Relatório BSS");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("v").setLabel("VENCEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("p").setLabel("PERDEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("pl").setLabel("PLACAR (EX: 13-05)").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("m").setLabel("MVP").setStyle(TextInputStyle.Short).setRequired(true))
      );
      return await interaction.showModal(modal);
    }

    // 3. CANCELAR
    if (interaction.customId === "match_cancel") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "🚫 Sem permissão.", ephemeral: true });
      await interaction.reply("⚠️ Deletando canal em 5 segundos...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    // 4. INICIAR PICK/BAN
    if (interaction.customId === "pb_start") {
      const mentions = interaction.message.content.match(/\d+/g);
      const stateData = {
        iglA: mentions[0], iglB: mentions[1],
        pool: [...MAP_POOL], bans: [], picks: [], logs: [], statusLado: false, 
        ultimoPick: "", turno: (Math.random() > 0.5 ? mentions[0] : mentions[1])
      };
      activePickBans.set(interaction.channel.id, stateData);
      await interaction.message.delete().catch(() => {});
      return refreshPB(interaction.channel, stateData);
    }

    // 5. LÓGICA DE PICK/BAN / LADOS
    if (interaction.customId.startsWith("pb_") || interaction.customId.startsWith("side_")) {
      if (!state || interaction.user.id !== state.turno) return interaction.reply({ content: "❌ Não é sua vez!", ephemeral: true });

      if (interaction.customId.startsWith("pb_")) {
        const mapa = interaction.customId.replace("pb_", "");
        state.pool = state.pool.filter(m => m !== mapa);

        if (state.bans.length < 4) {
          state.bans.push(mapa);
          state.logs.push(`🔴 Veto: <@${interaction.user.id}> baniu **${mapa}**`);
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        } else {
          state.picks.push(mapa);
          state.logs.push(`🟢 Pick: <@${interaction.user.id}> escolheu **${mapa}**`);
          state.ultimoPick = interaction.user.id; // Salva quem pickou
          state.statusLado = true; // Trava para escolher lado
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA; // Turno de quem NÃO pickou
        }
      } else {
        const lado = interaction.customId.split("_")[1];
        state.logs.push(`⚖️ Lado: <@${interaction.user.id}> começa de **${lado}** em **${state.picks[state.picks.length-1]}**`);
        state.statusLado = false;
        // DEVOLVE O TURNO: Se o A pickou, o B escolheu lado, agora o turno é do B para pickar o proximo mapa.
        state.turno = state.ultimoPick === state.iglA ? state.iglB : state.iglA;
      }
      
      await interaction.deferUpdate();
      return checkFinish(interaction, state);
    }
  }

  // RECEBIMENTO DO MODAL (RESULTADO)
  if (interaction.isModalSubmit() && interaction.customId === "modal_bss_final") {
    const v = interaction.fields.getTextInputValue("v");
    const p = interaction.fields.getTextInputValue("p");
    const pl = interaction.fields.getTextInputValue("pl");
    const m = interaction.fields.getTextInputValue("m");

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("🏆 RESULTADO OFICIAL BSS")
      .addFields(
        { name: "👑 Vencedor", value: `**${v}**`, inline: true },
        { name: "💀 Perdedor", value: `**${p}**`, inline: true },
        { name: "📍 Placar", value: `\`\`\`${pl}\`\`\`` },
        { name: "🌟 MVP", value: m }
      ).setTimestamp();

    const canalRes = await client.channels.fetch(IDS.RESULTADOS);
    if (canalRes) await canalRes.send({ embeds: [embed] });

    await interaction.reply("✅ Resultado enviado com sucesso!");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
  }
});

/* ======================================================
    📊 FUNÇÕES AUXILIARES
   ====================================================== */
async function refreshPB(channel, state) {
  const embed = new EmbedBuilder()
    .setTitle("🗺️ SISTEMA DE PICK/BAN BSS")
    .setColor(state.statusLado ? "#FFFF00" : "#00FF00")
    .setDescription(`👤 Vez de: <@${state.turno}>\n\n**Logs:**\n${state.logs.join("\n") || "_Aguardando primeira ação..._"}`);

  const rows = [];
  if (state.statusLado) {
    const rowSide = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("side_CT").setLabel("COMEÇAR CT").setStyle(ButtonStyle.Secondary).setEmoji("👮"),
      new ButtonBuilder().setCustomId("side_TR").setLabel("COMEÇAR TR").setStyle(ButtonStyle.Primary).setEmoji("🧨")
    );
    rows.push(rowSide);
  } else {
    let row = new ActionRowBuilder();
    state.pool.forEach((mapa, index) => {
      if (index > 0 && index % 5 === 0) { rows.push(row); row = new ActionRowBuilder(); }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`pb_${mapa}`)
          .setLabel(mapa)
          .setStyle(state.bans.length < 4 ? ButtonStyle.Danger : ButtonStyle.Success)
      );
    });
    rows.push(row);
  }

  // Deleta a mensagem anterior para manter o chat limpo
  if (state.lastMsgId) {
    const oldMsg = await channel.messages.fetch(state.lastMsgId).catch(() => null);
    if (oldMsg) await oldMsg.delete().catch(() => {});
  }

  const msg = await channel.send({ embeds: [embed], components: rows });
  state.lastMsgId = msg.id;
}

async function checkFinish(interaction, state) {
  if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
    const mapa3 = state.pool[0];
    const embedFinal = new EmbedBuilder()
      .setTitle("🏁 MAPAS DEFINIDOS")
      .setColor("#5865F2")
      .setDescription(`1. **${state.picks[0]}**\n2. **${state.picks[1]}**\n3. **${mapa3}** (Decisivo)`);

    await interaction.channel.send({ content: "✅ **Vetou/Escolheu tudo! Boa sorte.**", embeds: [embedFinal] });
    
    const pbLog = await interaction.client.channels.fetch(IDS.PICKBAN);
    if (pbLog) pbLog.send({ embeds: [embedFinal] });

    const amistosLog = await interaction.client.channels.fetch(IDS.AMISTOSOS);
    if (amistosLog) amistosLog.send({ content: "🔥 **NOVO AMISTOSO MARCADO!**", embeds: [embedFinal] });

    activePickBans.delete(interaction.channel.id);
  } else {
    refreshPB(interaction.channel, state);
  }
}

client.login(process.env.TOKEN);
