const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "quarentena",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const alvo = message.mentions.members.first();
    const motivo = args.slice(1).join(" ") || "Irregularidade sob investigação.";
    const cargoAnaliseId = "1471160904598163466";
    const canalAnuncioId = "1471160378535710731";
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    if (!alvo) return message.reply("⚠️ Mencione o jogador: `.quarentena @player motivo`.");

    await alvo.roles.add(cargoAnaliseId).catch(() => {});

    const embed = new EmbedBuilder()
      .setAuthor({ name: "🛡️ BSS | QUARENTENA COMPETITIVA", iconURL: logoBSS })
      .setColor("#E67E22")
      .setTitle("🔴 JOGADOR EM ANÁLISE")
      .setDescription(`O jogador **${alvo.user.tag}** foi temporariamente afastado das competições para auditoria técnica.`)
      .addFields(
        { name: "👮 Admin", value: `${message.author.username}`, inline: true },
        { name: "⚖️ Status", value: "`Sob Investigação`", inline: true },
        { name: "📝 Motivo", value: `\`\`\`yaml\n${motivo}\n\`\`\`` }
      )
      .setThumbnail(alvo.user.displayAvatarURL())
      .setFooter({ text: "Base Strike Series • Fair Play" });

    const canalAnuncio = client.channels.cache.get(canalAnuncioId);
    if (canalAnuncio) await canalAnuncio.send({ embeds: [embed] });
    message.reply("✅ Quarentena aplicada!");
  }
};
