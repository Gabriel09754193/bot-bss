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
    🔘 SISTEMA DE INTERAÇÕES REVISADO
   ====================================================== */
client.on("interactionCreate", async (interaction) => {
  const state = activePickBans.get(interaction.channel.id);
  const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

  if (interaction.isButton()) {
    
    // 1. ACEITAR DESAFIO (Aberto para IGLs)
    if (interaction.customId === "bss_match_aceitar") {
      const iglAId = interaction.message.embeds[0].fields[1].value.match(/\d+/)[0];
      const nomeA = interaction.message.embeds[0].fields[0].value.replace(/\*/g, "");

      if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: `⚔️┃${nomeA}-vs-desafio`,
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

      const embedPrivado = new EmbedBuilder()
        .setTitle("🤝 CONFRONTO INICIADO")
        .setColor("#2b2d31")
        .setDescription(`Bem-vindos ao chat privado da partida!\n\n**REGRAS:**\n1. Este canal é para alinhar o Pick/Ban e resultados.\n2. **⚠️ APENAS ADMINISTRADORES** podem clicar nos botões abaixo.\n3. O sistema de Pick/Ban é automatizado após o início.`)
        .addFields(
            { name: "🏠 Time A", value: nomeA, inline: true },
            { name: "🚀 Time B", value: interaction.user.username, inline: true }
        )
        .setFooter({ text: "Aguarde um Staff iniciar o processo." });

      await interaction.reply({ content: `✅ Canal Criado: ${channel}`, ephemeral: true });
      await channel.send({ content: `🔔 <@${iglAId}> & <@${interaction.user.id}>`, embeds: [embedPrivado], components: [row] });
      return;
    }

    // BLOQUEIO DE SEGURANÇA PARA BOTÕES DE ADMIN
    if (["pb_start", "match_result", "match_cancel"].includes(interaction.customId) && !isAdmin) {
        return interaction.reply({ content: "🚫 Apenas membros da **Staff (Admin)** podem gerenciar esta partida.", ephemeral: true });
    }

    // 2. CANCELAR
    if (interaction.customId === "match_cancel") {
      await interaction.reply("⚠️ Deletando canal em 5 segundos...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      return;
    }

    // 3. INICIAR PICK/BAN
    if (interaction.customId === "pb_start") {
      const mentions = interaction.message.content.match(/\d+/g);
      const stateData = {
        iglA: mentions[0], iglB: mentions[1],
        timeA: interaction.message.embeds[0].fields[0].value,
        timeB: interaction.message.embeds[0].fields[1].value,
        pool: [...MAP_POOL], bans: [], picks: [], logs: [], statusLado: false, 
        ultimoPick: "", turno: (Math.random() > 0.5 ? mentions[0] : mentions[1])
      };
      activePickBans.set(interaction.channel.id, stateData);
      await interaction.message.delete().catch(() => {});
      return refreshPB(interaction.channel, stateData);
    }

    // 4. LÓGICA DE TURNOS (Aqui os IGLs podem clicar)
    if (interaction.customId.startsWith("pb_") || interaction.customId.startsWith("side_")) {
      if (!state || interaction.user.id !== state.turno) return interaction.reply({ content: "❌ Não é sua vez!", ephemeral: true });

      if (interaction.customId.startsWith("pb_")) {
        const mapa = interaction.customId.replace("pb_", "");
        state.pool = state.pool.filter(m => m !== mapa);

        if (state.bans.length < 4) {
          state.bans.push(mapa);
          state.logs.push(`🔴 **Veto:** <@${interaction.user.id}> removeu \`${mapa}\``);
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        } else {
          state.picks.push(mapa);
          state.logs.push(`🟢 **Pick:** <@${interaction.user.id}> selecionou \`${mapa}\``);
          state.ultimoPick = interaction.user.id;
          state.statusLado = true;
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        }
      } else {
        const lado = interaction.customId.split("_")[1];
        state.logs.push(`⚖️ **Lado:** <@${interaction.user.id}> escolheu **${lado}** em \`${state.picks[state.picks.length-1]}\``);
        state.statusLado = false;
        state.turno = state.ultimoPick === state.iglA ? state.iglB : state.iglA;
      }
      
      await interaction.deferUpdate();
      return checkFinish(interaction, state);
    }

    // 5. BOTÃO RESULTADO
    if (interaction.customId === "match_result") {
      const modal = new ModalBuilder().setCustomId("modal_bss_final").setTitle("🏆 Relatório BSS");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("v").setLabel("VENCEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("p").setLabel("PERDEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("pl").setLabel("PLACAR (EX: 13-05)").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("m").setLabel("MVP").setStyle(TextInputStyle.Short).setRequired(true))
      );
      return await interaction.showModal(modal);
    }
  }

  // SUBMIT DO MODAL
  if (interaction.isModalSubmit() && interaction.customId === "modal_bss_final") {
    const v = interaction.fields.getTextInputValue("v");
    const p = interaction.fields.getTextInputValue("p");
    const pl = interaction.fields.getTextInputValue("pl");
    const m = interaction.fields.getTextInputValue("m");

    const embedResult = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("🏆 VITÓRIA CONFIRMADA | BSS")
      .addFields(
        { name: "👑 Vencedor", value: `**${v}**`, inline: true },
        { name: "💀 Perdedor", value: `**${p}**`, inline: true },
        { name: "📍 Placar", value: `\`\`\`${pl}\`\`\`` },
        { name: "🌟 MVP", value: m }
      ).setThumbnail("https://i.imgur.com/8E9X9ZQ.png").setTimestamp();

    const canalRes = await client.channels.fetch(IDS.RESULTADOS);
    if (canalRes) await canalRes.send({ embeds: [embedResult] });

    await interaction.reply("✅ Enviado! Canal fechando...");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
  }
});

/* ======================================================
    📊 FUNÇÕES AUXILIARES REVISADAS
   ====================================================== */
async function refreshPB(channel, state) {
  const embed = new EmbedBuilder()
    .setTitle("🗺️ SISTEMA DE PICK/BAN BSS")
    .setColor("#2f3136")
    .setDescription(`👤 **Vez de:** <@${state.turno}>\n🎯 **Ação:** ${state.statusLado ? "`Escolher Lado`" : (state.bans.length < 4 ? "`Banir Mapa`" : "`Escolher Mapa`")}\n\n**📜 Histórico:**\n${state.logs.join("\n") || "_Aguardando..._"}`);

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
      if (index > 0 && index % 4 === 0) { rows.push(row); row = new ActionRowBuilder(); }
      row.addComponents(new ButtonBuilder().setCustomId(`pb_${mapa}`).setLabel(mapa).setStyle(state.bans.length < 4 ? ButtonStyle.Danger : ButtonStyle.Success));
    });
    rows.push(row);
  }

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
    
    // Embed de LOG (COMPLETO)
    const logCompleto = new EmbedBuilder()
      .setTitle("📋 LOG DE PICK/BAN - BSS")
      .setColor("#2b2d31")
      .addFields(
        { name: "🏠 Confronto", value: `${state.timeA} vs ${state.timeB}` },
        { name: "✅ Mapas", value: `1. ${state.picks[0]}\n2. ${state.picks[1]}\n3. ${mapa3}` },
        { name: "📜 Histórico de Ações", value: state.logs.join("\n") }
      );

    // Embed de ANÚNCIO (BONITO/RESUMIDO)
    const anuncioBonito = new EmbedBuilder()
      .setTitle("⚔️ AMISTOSO CONFIRMADO")
      .setColor("#FF0000")
      .setDescription(`**${state.timeA}** vs **${state.timeB}**`)
      .addFields({ name: "📍 Mapas do Dia", value: `\`1.\` ${state.picks[0]}\n\`2.\` ${state.picks[1]}\n\`3.\` ${mapa3}` })
      .setThumbnail("https://i.imgur.com/8E9X9ZQ.png");

    await interaction.channel.send({ content: "🏁 **Pick/Ban finalizado com sucesso!**", embeds: [anuncioBonito] });
    
    const pbLog = await interaction.client.channels.fetch(IDS.PICKBAN);
    if (pbLog) pbLog.send({ embeds: [logCompleto] });

    const amistosLog = await interaction.client.channels.fetch(IDS.AMISTOSOS);
    if (amistosLog) amistosLog.send({ content: "🔥 **PARTIDA EM BREVE!**", embeds: [anuncioBonito] });

    activePickBans.delete(interaction.channel.id);
  } else {
    refreshPB(interaction.channel, state);
  }
}

client.login(process.env.TOKEN);
