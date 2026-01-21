const fs = require('fs');
const { REST, Routes } = require('discord.js');
require('dotenv').config(); // garante que o TOKEN, CLIENT_ID e GUILD_ID sejam lidos do Railway ou .env

const commands = [];
const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./comandos/${file}`);
  commands.push(command.data.toJSON());
}

// Variáveis de ambiente
const CLIENT_ID = process.env.CLIENT_ID; // ID do seu bot
const GUILD_ID = process.env.GUILD_ID;   // ID do servidor de teste
const TOKEN = process.env.TOKEN;

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🚀 Registrando comandos na guilda...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Comandos registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();
