const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "decisao",
  execute: async (message, args, client) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const alvo = message.mentions.members.first();
    const status = args[1]?.toLowerCase();
    const info = args.slice(2).join(" ");
    
    const canalAnuncioId = "1471160378535710731";
    const cargoElegivelId = "1471161180524380293";
    const cargoAnaliseId = "1471160904598163466";
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";

    if (!alvo || !status) return message.reply("⚠️ `.decisao @alvo [elegivel/afastado/realocado] [motivo]`");

    const embed = new EmbedBuilder()
      .setAuthor({ name: "🏆 BSS | DECISÃO OFICIAL", iconURL: logoBSS })
      .setThumbnail(alvo.user.displayAvatarURL())
      .setTimestamp();

    // Remove cargo de análise sempre que houver uma decisão
    await alvo.roles.remove(cargoAnaliseId).catch(() => {});

    if (status === "elegivel") {
      await alvo.roles.add(cargoElegivelId).catch(() => {});
      embed.setColor("#2ECC71").setTitle("✅ STATUS: ELEGÍVEL")
           .setDescription(`Parabéns! **${alvo}** foi aprovado em nossa auditoria e está liberado para o jogo.`);
    } else if (status === "afastado") {
      embed.setColor("#C0392B").setTitle("🚫 STATUS: AFASTADO")
           .setDescription(`Infelizmente, **${alvo}** foi removido da competição por não cumprir os requisitos.`);
    } else if (status === "realocado") {
      embed.setColor("#3498DB").setTitle("🔄 STATUS: REALOCADO")
           .setDescription(`**${alvo}** foi movido para uma nova categoria.\n**Nota:** ${info}`);
    }

    const canal = client.channels.cache.get(canalAnuncioId);
    if (canal) await canal.send({ embeds: [embed] });
    message.reply("✅ Decisão publicada!");
  }
};
