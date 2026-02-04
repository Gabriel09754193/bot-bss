const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "on",
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    try { await message.delete(); } catch (e) {}

    const embed = new EmbedBuilder()
      .setTitle("🟢 BSS BOT - ONLINE")
      .setDescription("O sistema da **BSS E-sports** foi iniciado com sucesso!")
      .addFields(
        { name: "📶 Status", value: "Operacional", inline: true },
        { name: "⚡ Latência", value: `${client.ws.ping}ms`, inline: true }
      )
      .setColor("#00FF00")
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp();

    await message.channel.send({ content: "@everyone", embeds: [embed] });
  }
}; // Verifique se essa chave existe no seu arquivo!
