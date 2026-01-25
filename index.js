const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

/* =====================================================
   📂 CARREGAR COMANDOS (COM PROTEÇÃO)
===================================================== */

const commandFiles = fs
  .readdirSync("./comandos")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  try {
    const command = require(`./comandos/${file}`);

    if (!command.nome || typeof command.execute !== "function") {
      console.log(
        `⚠️ Comando ignorado (${file}) → estrutura inválida`
      );
      continue;
    }

    client.commands.set(command.nome, command);
    console.log(`✅ Comando carregado: .${command.nome}`);
  } catch (err) {
    console.error(`❌ Erro ao carregar ${file}`);
    console.error(err);
  }
}

/* =====================================================
   🤖 BOT ONLINE
===================================================== */

client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

/* =====================================================
   💬 ESCUTAR COMANDOS
===================================================== */

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(".")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return; // não existe → ignora

  try {
    await command.execute(client, message, args);
  } catch (err) {
    console.error(`❌ Erro no comando .${commandName}`);
    console.error(err);
    message.reply("❌ Erro ao executar este comando.");
  }
});

client.login(process.env.TOKEN);
