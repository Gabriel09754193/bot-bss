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

client.once("ready", () => console.log(`🤖 Bot online: ${client.user.tag}`));

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(".")) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const command = client.commands.get(args.shift().toLowerCase());
  if (command) command.execute(message, args, client).catch(console.error);
});

/* ======================================================
    🔘 SISTEMA DE INTERAÇÕES (INDEX + INTERACTION)
   ====================================================== */
client.on("interactionCreate", async (interaction) => {
  const state = activePickBans.get(interaction.channel.id);

  if (interaction.isButton()) {
    // 1. ACEITAR DESAFIO
    if (interaction.customId === "bss_accept_match") {
      const iglAId = interaction.message.embeds[0].footer.text;
      if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio desafio.", ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: `⚔️┃match-${interaction.user.username}`,
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

      await interaction.reply({ content: `✅ Sucesso! Canal: ${channel}`, ephemeral: true });
      await channel.send({
        content: `🔔 <@${iglAId}> vs <@${interaction.user.id}>`,
        embeds: [new EmbedBuilder().setTitle("🤝 CONFRONTO CONFIRMADO").setDescription("Administradores, usem os botões abaixo.").setColor("#0099ff")],
        components: [row]
      });
    }

    // 2. MODAL DE RESULTADO
    if (interaction.customId === "match_result") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "🚫 Apenas Admins.", ephemeral: true });
      
      const modal = new ModalBuilder().setCustomId("modal_bss_final").setTitle("🏆 Relatório BSS");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("v").setLabel("VENCEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("p").setLabel("PERDEDOR").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("pl").setLabel("PLACAR").setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("m").setLabel("MVP").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("e").setLabel("INFO EXTRA").setStyle(TextInputStyle.Short).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    // 3. CANCELAR
    if (interaction.customId === "match_cancel") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "🚫 Sem permissão.", ephemeral: true });
      await interaction.reply("⚠️ Deletando...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    // 4. INICIAR PICK/BAN
    if (interaction.customId === "pb_start") {
      const ids = interaction.message.content.match(/\d+/g);
      const stateData = {
        iglA: ids[0], iglB: ids[1],
        pool: [...MAP_POOL], bans: [], picks: [], logs: [], statusLado: false, turno: (Math.random() > 0.5 ? ids[0] : ids[1])
      };
      activePickBans.set(interaction.channel.id, stateData);
      await interaction.update({ content: "🎮 Pick/Ban em andamento...", components: [interaction.message.components[0]] });
      return refreshPB(interaction.channel, stateData);
    }

    // 5. LÓGICA DE VETOS E LADOS
    if (interaction.customId.startsWith("pb_") || interaction.customId.startsWith("side_")) {
      if (!state || interaction.user.id !== state.turno) return interaction.reply({ content: "❌ Não é sua vez!", ephemeral: true });
      
      if (interaction.customId.startsWith("pb_")) {
        const mapa = interaction.customId.replace("pb_", "");
        state.pool = state.pool.filter(m => m !== mapa);
        if (state.bans.length < 4) {
          state.bans.push(mapa); state.logs.push(`🔴 Veto: <@${interaction.user.id}> - ${mapa}`);
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        } else {
          state.picks.push(mapa); state.logs.push(`🟢 Pick: <@${interaction.user.id}> - ${mapa}`);
          state.statusLado = true; state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        }
      } else {
        const lado = interaction.customId.split("_")[1];
        state.logs.push(`⚖️ Lado: <@${interaction.user.id}> escolheu **${lado}**`);
        state.statusLado = false;
      }
      await interaction.deferUpdate();
      return checkFinish(interaction, state);
    }
  }

  // ENVIO DO MODAL
  if (interaction.isModalSubmit() && interaction.customId === "modal_bss_final") {
    const embed = new EmbedBuilder().setColor("#00FF00").setTitle("🏆 RESULTADO BSS")
      .addFields(
        { name: "✅ Vencedor", value: interaction.fields.getTextInputValue("v") },
        { name: "📍 Placar", value: `\`\`\`${interaction.fields.getTextInputValue("pl")}\`\`\`` },
        { name: "🌟 MVP", value: interaction.fields.getTextInputValue("m") }
      );
    const log = await interaction.client.channels.fetch(IDS.RESULTADOS);
    if (log) log.send({ embeds: [embed] });
    await interaction.reply("✅ Enviado!");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
  }
});

function refreshPB(channel, state) {
  const row = new ActionRowBuilder();
  if (state.statusLado) {
    row.addComponents(
      new ButtonBuilder().setCustomId("side_CT").setLabel("CT").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("side_TR").setLabel("TR").setStyle(ButtonStyle.Primary)
    );
  } else {
    state.pool.slice(0, 5).forEach(m => row.addComponents(new ButtonBuilder().setCustomId(`pb_${m}`).setLabel(m).setStyle(state.bans.length < 4 ? ButtonStyle.Danger : ButtonStyle.Success)));
  }
  channel.send({ content: `👤 Vez de: <@${state.turno}>\n📜 **Logs:**\n${state.logs.join("\n") || "..."}`, components: [row] });
}

async function checkFinish(interaction, state) {
  if (!state.statusLado && state.bans.length === 4 && state.picks.length === 2) {
    const finalEmbed = new EmbedBuilder().setTitle("🗺️ MAPAS DEFINIDOS").setDescription(`1. ${state.picks[0]}\n2. ${state.picks[1]}\n3. ${state.pool[0]}`);
    await interaction.channel.send({ embeds: [finalEmbed] });
    const log = await interaction.client.channels.fetch(IDS.PICKBAN);
    if (log) log.send({ embeds: [finalEmbed] });
    activePickBans.delete(interaction.channel.id);
  } else { refreshPB(interaction.channel, state); }
}

client.login(process.env.TOKEN);
