const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// 📂 CARREGAR COMANDOS
const commandFiles = fs
  .readdirSync("./comandos")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.nome, command);
  
  // --- ADIÇÃO PARA O PICKBAN ---
  if (command.setupPickBan) command.setupPickBan(client);
}

client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// 💬 COMANDOS COM PREFIXO .
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(".")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply("❌ Erro ao executar o comando.");
  }
});

/* ======================================================
    🔘 INTERACTIONS (BOTÕES / MODAIS / RESULTADOS)
   ====================================================== */
client.on("interactionCreate", async (interaction) => {

  // --- PARTE 1: CLIQUE EM BOTÕES ---
  if (interaction.isButton()) {

    // BOTÃO: ACEITAR AMISTOSO (Seu código original preservado)
    if (interaction.customId === "bss_accept_match") {
      const embedOriginal = interaction.message.embeds[0];
      if (!embedOriginal) return interaction.reply({ content: "❌ Erro ao identificar a partida.", ephemeral: true });

      const iglAId = embedOriginal.footer?.text;
      if (!iglAId) return interaction.reply({ content: "❌ IGL da partida não encontrado.", ephemeral: true });
      if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar a própria partida.", ephemeral: true });

      const guild = interaction.guild;
      const channel = await guild.channels.create({
        name: `bss-match-${interaction.user.username}`,
        type: 0,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: iglAId, allow: ["ViewChannel", "SendMessages"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
          { id: client.user.id, allow: ["ViewChannel", "SendMessages"] },
        ],
      });

      await interaction.reply({ content: "✅ Partida aceita! Chat criado.", ephemeral: true });

      channel.send({
        embeds: [{
          color: 0x0d0d0d,
          title: "🔥 Base Strikes Series | Amistoso Criado",
          description: "Bem-vindos ao chat da partida!\n\n🟢 **IGL A:** <@" + iglAId + ">\n🔵 **IGL B:** <@" + interaction.user.id + ">\n\n📌 Em breve iniciaremos o **Pick/Ban de mapas**.",
          footer: { text: "Base Strikes Series • BSS" },
        }],
      });
    }

    // BOTÃO: ABRIR MODAL DE RESULTADO (Apenas Admins)
    if (interaction.customId === "match_result") {
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({ content: "🚫 **Acesso Negado:** Apenas Administradores da BSS podem usar este botão.", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId("modal_bss_final")
        .setTitle("🏆 Relatório Premium BSS");

      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("venc").setLabel("EQUIPE VENCEDORA").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("perd").setLabel("EQUIPE PERDEDORA").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("plac").setLabel("PLACAR (EX: 13-05 / 13-10)").setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("mvp").setLabel("MVP DA PARTIDA").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("LINK DA PRINT OU DEMO").setStyle(TextInputStyle.Short).setRequired(false))
      );

      return await interaction.showModal(modal);
    }

    // BOTÃO: CANCELAR PARTIDA (Apenas Admins)
    if (interaction.customId === "match_cancel") {
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({ content: "🚫 **Acesso Negado:** Apenas Administradores podem cancelar.", ephemeral: true });
      }
      await interaction.reply("⚠️ Cancelando partida... O canal será deletado em 5 segundos.");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }

  // --- PARTE 2: ENVIO DO MODAL (SUBMIT) ---
  if (interaction.isModalSubmit() && interaction.customId === "modal_bss_final") {
    const v = interaction.fields.getTextInputValue("venc");
    const p = interaction.fields.getTextInputValue("perd");
    const pl = interaction.fields.getTextInputValue("plac");
    const mvp = interaction.fields.getTextInputValue("mvp");
    const ex = interaction.fields.getTextInputValue("extra") || "Não informado";

    const ID_RESULTADOS = "1463260797604987014";

    const embedRes = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("🏆 BSS | RESULTADO DO CONFRONTO")
      .setDescription(`A equipe **${v}** garantiu a vitória contra **${p}**!`)
      .addFields(
        { name: "📍 Placar por Mapas", value: `\`\`\`arm\n${pl}\n\`\`\`` },
        { name: "🌟 MVP e Estatísticas", value: `> ${mvp}`, inline: true },
        { name: "📅 Info Extra / Link", value: `> ${ex}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Liga Base Strike Series" });

    try {
      const canalRes = await interaction.client.channels.fetch(ID_RESULTADOS);
      if (canalRes) await canalRes.send({ embeds: [embedRes] });
      
      await interaction.reply("✅ Resultado enviado com sucesso! Deletando este canal em 10 segundos.");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
    } catch (err) {
      console.error("Erro ao enviar resultado:", err);
      await interaction.reply({ content: "❌ Erro ao enviar para o canal de resultados. Verifique os IDs.", ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
