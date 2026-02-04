const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "on",
  async execute(message, args, client) {
    // Verifica se é administrador
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    // Tenta apagar a mensagem do comando (.on)
    try { await message.delete(); } catch (e) {}

    const embed = new EmbedBuilder()
      .setTitle("🟢 BSS BOT - ONLINE")
      .setDescription("O sistema da **BSS E-sports** foi iniciado com sucesso e todos os comandos de resultados estão operacionais.")
      .addFields(
        { name: "📶 Status", value: "Operacional", inline: true },
        { name: "⚡ Latência", value: `${client.ws.ping}ms`, inline: true }
      )
      .setColor("#00FF00")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: "Bom jogo a todos!" })
      .setTimestamp();

    await message.channel.send({ content: "@everyone", embeds: [embed] });
  },
  
