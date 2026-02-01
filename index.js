const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
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
  // Se o comando tiver a função de setup, nós a ativamos aqui
  if (command.setupPickBan) command.setupPickBan(client);
  // -----------------------------
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
   🔘 INTERACTIONS (BOTÕES / FUTUROS SELECTS)
   ====================================================== */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // BOTÃO: ACEITAR AMISTOSO
  if (interaction.customId === "bss_accept_match") {
    // ... Seu código de aceitar match continua aqui igual ...
    const embedOriginal = interaction.message.embeds[0];
    if (!embedOriginal) {
      return interaction.reply({
        content: "❌ Erro ao identificar a partida.",
        ephemeral: true,
      });
    }

    const iglAId = embedOriginal.footer?.text;
    if (!iglAId) {
      return interaction.reply({
        content: "❌ IGL da partida não encontrado.",
        ephemeral: true,
      });
    }

    if (interaction.user.id === iglAId) {
      return interaction.reply({
        content: "❌ Você não pode aceitar a própria partida.",
        ephemeral: true,
      });
    }

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
      embeds: [
        {
          color: 0x0d0d0d,
          title: "🔥 Base Strikes Series | Amistoso Criado",
          description: "Bem-vindos ao chat da partida!\n\n🟢 **IGL A:** <@" + iglAId + ">\n🔵 **IGL B:** <@" + interaction.user.id + ">\n\n📌 Em breve iniciaremos o **Pick/Ban de mapas**.",
          footer: { text: "Base Strikes Series • BSS" },
        },
      ],
    });
  }
});

client.login(process.env.TOKEN);
