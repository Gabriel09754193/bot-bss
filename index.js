const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync("./comandos").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.nome, command);
}

// Importamos a lógica centralizada do arquivo de comando
const matchLogic = require("./comandos/match.js");

client.once("ready", () => console.log(`🤖 BSS Bot Online: ${client.user.tag}`));

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(".")) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const command = client.commands.get(args.shift().toLowerCase());
  if (command) command.execute(message, args, client).catch(console.error);
});

client.on("interactionCreate", async (interaction) => {
  const state = matchLogic.activePickBans.get(interaction.channel.id);
  const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

  if (interaction.isButton()) {
    // 1. ACEITAR DESAFIO
    if (interaction.customId === "bss_match_aceitar") {
      const iglAId = interaction.message.embeds[0].footer.text.split("ID:")[1];
      if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio desafio.", ephemeral: true });

      const modalTimeB = new ModalBuilder().setCustomId("modal_aceitar_desafio").setTitle("🛡️ Confirmar Presença");
      modalTimeB.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("nome_time_b").setLabel("NOME DA SUA EQUIPE").setStyle(TextInputStyle.Short).setRequired(true)
      ));
      return await interaction.showModal(modalTimeB);
    }

    // 2. CONTROLES DE ADMIN (PickBan, Resultado, Cancelar)
    if (["pb_start", "match_result", "match_cancel"].includes(interaction.customId) && !isAdmin) {
      return interaction.reply({ content: "🚫 Apenas a **Staff BSS** pode clicar aqui.", ephemeral: true });
    }

    if (interaction.customId === "match_cancel") {
      await interaction.reply("⚠️ Canal será deletado em 5 segundos...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      return;
    }

    if (interaction.customId === "pb_start") {
      const mentions = interaction.message.content.match(/\d+/g);
      const stateData = {
        iglA: mentions[0], iglB: mentions[1],
        timeA: interaction.message.embeds[0].fields[0].value,
        timeB: interaction.message.embeds[0].fields[1].value,
        pool: [...matchLogic.MAP_POOL], bans: [], picks: [], logs: [], statusLado: false, 
        ultimoPick: "", turno: (Math.random() > 0.5 ? mentions[0] : mentions[1])
      };
      matchLogic.activePickBans.set(interaction.channel.id, stateData);
      await interaction.deferUpdate();
      return matchLogic.refreshPB(interaction.channel, stateData);
    }

    // 3. LÓGICA DE TURNOS (PICK/BAN E LADO)
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
          state.logs.push(`🟢 **Pick:** <@${interaction.user.id}> escolheu \`${mapa}\``);
          state.ultimoPick = interaction.user.id;
          state.statusLado = true;
          state.turno = state.turno === state.iglA ? state.iglB : state.iglA;
        }
      } else {
        const lado = interaction.customId.split("_")[1];
        state.logs.push(`⚖️ **Lado:** <@${interaction.user.id}> escolheu **${lado}** em \`${state.picks[state.picks.length-1]}\``);
        state.statusLado = false;
        // CORREÇÃO: O turno volta para quem NÃO pickou o mapa por último
        state.turno = state.ultimoPick === state.iglA ? state.iglB : state.iglA;
      }
      await interaction.deferUpdate();
      return matchLogic.checkFinish(interaction, state, client);
    }

    if (interaction.customId === "match_result") {
      const modalRes = new ModalBuilder().setCustomId("modal_bss_final").setTitle("🏆 Relatório Final");
      modalRes.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("v").setLabel("QUEM VENCEU?").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("pl").setLabel("PLACAR (EX: 13-05)").setStyle(TextInputStyle.Short).setRequired(true))
      );
      return await interaction.showModal(modalRes);
    }
  }

  // --- SUBMISSÃO DE MODALS ---
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "modal_aceitar_desafio") {
      const nomeB = interaction.fields.getTextInputValue("nome_time_b");
      const embedOriginal = interaction.message.embeds[0];
      const iglAId = embedOriginal.footer.text.split("ID:")[1];
      const nomeA = embedOriginal.fields[0].value;

      const channel = await interaction.guild.channels.create({
        name: `⚔️┃${nomeA}-vs-${nomeB}`,
        parent: matchLogic.IDS.CATEGORIA,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      });

      const embedEdit = EmbedBuilder.from(embedOriginal).setTitle("✅ PARTIDA EM ANDAMENTO").setColor("#00FF00")
        .addFields({ name: "🛡️ Equipe B", value: `**${nomeB}**`, inline: true }).setFooter({ text: `Iniciada por ${interaction.user.username}` });
      
      await interaction.update({ embeds: [embedEdit], components: [] });

      const embedPrivado = new EmbedBuilder().setTitle("🔥 AMISTOSO BSS").setColor("#2b2d31")
        .setDescription("Gerenciamento exclusivo da **Staff**.")
        .addFields({ name: "Time A", value: nomeA, inline: true }, { name: "Time B", value: nomeB, inline: true });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pb_start").setLabel("INICIAR PICK/BAN").setStyle(ButtonStyle.Primary).setEmoji("🗺️"),
        new ButtonBuilder().setCustomId("match_result").setLabel("RESULTADO").setStyle(ButtonStyle.Success).setEmoji("🏆"),
        new ButtonBuilder().setCustomId("match_cancel").setLabel("CANCELAR").setStyle(ButtonStyle.Danger).setEmoji("✖️")
      );

      await channel.send({ content: `🔔 <@${iglAId}> vs <@${interaction.user.id}>`, embeds: [embedPrivado], components: [row] });
    }

    if (interaction.customId === "modal_bss_final") {
      const v = interaction.fields.getTextInputValue("v");
      const pl = interaction.fields.getTextInputValue("pl");
      const embedFinal = new EmbedBuilder().setTitle("🏆 RESULTADO BSS").setColor("#FFD700")
        .addFields({ name: "⭐ Vencedor", value: `**${v}**` }, { name: "📊 Placar", value: `\`${pl}\`` }).setTimestamp();
      
      const ch = await client.channels.fetch(matchLogic.IDS.RESULTADOS);
      if (ch) ch.send({ embeds: [embedFinal] });
      await interaction.reply("✅ Resultado publicado! Deletando canal...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
    }
  }
});

client.login(process.env.TOKEN);
