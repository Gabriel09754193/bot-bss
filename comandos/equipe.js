module.exports = {
  nome: "equipe",
  execute: async (message, args, client) => {
    console.log("Comando equipe acionado!");
    message.reply("✅ O comando está carregado e funcionando!");
  }
};