const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
} = require("discord.js");
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

// 📂 comandos
for (const file of fs.readdirSync("./comandos").filter(f => f.endsWith(".js"))) {
  const cmd = require(`./comandos/${file}`);
  client.commands.set(cmd.nome, cmd);
}

client.once("ready", () => {
  console.log(`🤖 Online como ${client.user.tag}`);
});

// 🔹 comandos por prefixo
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(".")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const name = args.shift().toLowerCase();
  const cmd = client.commands.get(name);
  if (!cmd) return;

  try {
    await cmd.execute(message, args, client);
  } catch (e) {
    console.error(e);
    message.reply("❌ Erro ao executar comando.");
  }
});

client.login(process.env.TOKEN);
