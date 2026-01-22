const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config(); // só funciona localmente, no Railway ele ignora

// 🔹 CLIENTE DO DISCORD
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 🔹 CONEXÃO COM O MONGODB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado com sucesso"))
  .catch((err) =>
    console.error("❌ Erro ao conectar no MongoDB:", err)
  );

// 📂 CARREGAR COMANDOS
const commandFiles = fs
  .readdirSync("./comandos")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  client.commands.set(command.nome, command);
}

// 🔹 BOT ONLINE
client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// 🔹 MENSAGENS
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
    message.reply("❌ Ocorreu um erro ao executar o comando.");
  }
});

// 🔐 LOGIN
client.login(process.env.TOKEN);
