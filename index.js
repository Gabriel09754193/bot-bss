const { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  InteractionType 
} = require("discord.js");
const fs = require("fs");
require("dotenv").config();

// 🔹 CLIENTE
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 📂 CARREGAR COMANDOS
const commandFiles = fs
  .readdirSync("./comandos")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.nome, command);
}

// 🤖 BOT ONLINE
client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// 💬 COMANDOS COM .
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(".")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply("❌ Erro ao executar o comando.");
  }
});

// 🔘 INTERAÇÕES (BOTÕES)
client.on("interactionCreate", async (interaction) => {
  if (interaction.type !== InteractionType.MessageComponent) return;

  const [cmd, action, matchId] = interaction.customId.split(":");
  if (cmd !== "pickban") return;

  const command = client.commands.get("pickban");
  if (!command || !command.handleButton) return;

  try {
    await command.handleButton(interaction, action, matchId);
  } catch (err) {
    console.error(err);
    interaction.reply({ 
      content: "❌ Erro ao processar a ação.", 
      ephemeral: true 
    });
  }
});

// 🔐 LOGIN
client.login(process.env.TOKEN);
