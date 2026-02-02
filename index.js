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
    🔘 SISTEMA DE INTERAÇÕES
   ====================================================== */
client.on("interactionCreate", async (interaction) => {
  const state = activePickBans.get(interaction.channel.id);
  const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

  // --- BOTÕES ---
  if (interaction.isButton()) {
    
    // ACEITAR DESAFIO (ABRE MODAL PARA TIME B)
    if (interaction.customId === "bss_match_aceitar") {
      const iglAId = interaction.message.embeds[0].fields[1].value.match(/\d+/)[0];
      if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });

      const modalTimeB = new ModalBuilder().setCustomId("modal_aceitar_desafio").setTitle("🛡️ Confirmar Desafio");
      modalTimeB.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("nome_time_b").setLabel("QUAL O NOME DO SEU TIME?").setStyle(TextInputStyle.Short).setRequired(true)
      ));
      return await interaction.showModal(modalTimeB);
    }

    // BLOQUEIO ADMIN PARA COMANDOS DE CONTROLE
    if (["pb_start", "match_result", "match_cancel"].includes(interaction.customId) && !isAdmin) {
        return interaction.reply({ content: "🚫 Apenas membros da Staff podem gerenciar esta partida.", ephemeral: true });
    }

    if (interaction.customId === "match_cancel") {
      await interaction.reply("⚠️ Deletando canal em 5 segundos...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

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
      await interaction.reply({ content: "🗺️ Pick/Ban iniciado!", ephemeral: true });
      return refreshPB(interaction.channel, stateData);
    }

    // LÓGICA DE TURNOS
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

    if (interaction.customId === "match_result") {
      const modal = new ModalBuilder().setCustomId("modal_bss_final").setTitle("🏆 Relatório BSS");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("v").setLabel("VENCEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("p").setLabel("PERDEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("pl").setLabel("PLACAR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("m").setLabel("MVP").setStyle(TextInputStyle.Short).setRequired(true))
      );
      return await interaction.showModal(modal);
    }
  }

  // --- MODALS ---
  if (interaction.isModalSubmit()) {
    // MODAL DE ACEITAR (CRIAR CANAL E EDITAR ORIGINAL)
    if (interaction.customId === "modal_aceitar_desafio") {
      const nomeB = interaction.fields.getTextInputValue("nome_time_b");
      const embedOriginal = interaction.message.embeds[0];
      const iglAId = embedOriginal.fields[1].value.match(/\d+/)[0];
      const nomeA = embedOriginal.fields[0].value;

      // 1. Criar Canal
      const channel = await interaction.guild.channels.create({
        name: `⚔️┃${nomeA}-vs-${nomeB}`,
        parent: IDS.CATEGORIA,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      });

      // 2. Editar mensagem original no canal de espera
      const embedEditada = EmbedBuilder.from(embedOriginal)
        .setTitle("✅ DESAFIO ACEITO")
        .setColor("#00FF00")
        .addFields({ name: "🛡️ Equipe Desafiante (B)", value: `**${nomeB}**`, inline: true })
        .setFooter({ text: `Aceito por ${interaction.user.username}` });

      await interaction.update({ embeds: [embedEditada], components: [] });

      // 3. Enviar painel no canal privado
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pb_start").setLabel("INICIAR PICK/BAN").setStyle(ButtonStyle.Primary).setEmoji("🗺️"),
        new ButtonBuilder().setCustomId("match_result").setLabel("RESULTADO").setStyle(ButtonStyle.Success).setEmoji("🏆"),
        new ButtonBuilder().setCustomId("match_cancel").setLabel("CANCELAR").setStyle(ButtonStyle.Danger).setEmoji("✖️")
      );

      const embedPrivado = new EmbedBuilder()
        .setTitle("🤝 PAINEL DA PARTIDA")
        .setColor("#2b2d31")
        .setDescription("Apenas **Staff** pode usar os botões abaixo.")
        .addFields(
            { name: "🏠 Time A", value: nomeA, inline: true },
            { name: "🚀 Time B", value: nomeB, inline: true }
        );

      await channel.send({ content: `🔔 <@${iglAId}> vs <@${interaction.user.id}>`, embeds: [embedPrivado], components: [row] });
    }

    // MODAL FINAL (RESULTADO)
    if (interaction.customId === "modal_bss_final") {
        const v = interaction.fields.getTextInputValue("v");
        const pl = interaction.fields.getTextInputValue("pl");
        const embedRes = new EmbedBuilder().setTitle("🏆 RESULTADO BSS").setColor("#00FF00")
            .addFields({ name: "Vencedor", value: v }, { name: "Placar", value: `\`${pl}\`` });
        const ch = await client.channels.fetch(IDS.RESULTADOS);
        if (ch) ch.send({ embeds: [embedRes] });
        await interaction.reply("✅ Enviado!");
        setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
    }
  }
});

async function refreshPB(channel, state) {
  const embed = new EmbedBuilder().setTitle("🗺️ PICK/BAN").setColor("#2b2d31")
    .setDescription(`Vez de: <@${state.turno}>\n\n**Logs:**\n${state.logs.join("\n") || "..."}`);
  const row = new ActionRowBuilder();
  if (state.statusLado) {
    row.addComponents(
      new ButtonBuilder().setCustomId("side_CT").setLabel("CT").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("side_TR").setLabel("TR").setStyle(ButtonStyle.Primary)
    );
  } else {
    state.pool.slice(0, 4).forEach(m => row.addComponents(new ButtonBuilder().setCustomId(`pb_${m}`).setLabel(m).setStyle(state.bans.length < 4 ? ButtonStyle.Danger : ButtonStyle.Success)));
  }
  if (state.lastMsgId) {
    const old = await channel.messages.fetch(state.lastMsgId).catch(() => null);
    if (old) old.delete().catch(() => {});
  }
  const msg = await channel.send({ embeds: [embed], components: [row] });
  state.lastMsgId = msg.id;
}

async function checkFinish(interaction, state) {
  if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
    const m3 = state.pool[0];
    const an = new EmbedBuilder().setTitle("⚔️ AMISTOSO DEFINIDO").addFields({ name: "Mapas", value: `1. ${state.picks[0]}\n2. ${state.picks[1]}\n3. ${m3}` });
    const log = new EmbedBuilder().setTitle("📋 LOG COMPLETO").setDescription(state.logs.join("\n"));
    
    await interaction.channel.send({ embeds: [an] });
    const c1 = await client.channels.fetch(IDS.PICKBAN); if (c1) c1.send({ embeds: [log] });
    const c2 = await client.channels.fetch(IDS.AMISTOSOS); if (c2) c2.send({ embeds: [an] });
    activePickBans.delete(interaction.channel.id);
  } else { refreshPB(interaction.channel, state); }
}

client.login(process.env.TOKEN);
