const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    // 🔒 Apenas admins (por enquanto)
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.reply(
        "❌ **Apenas administradores podem usar este comando.**"
      );
    }

    // 🧱 Embed principal
    const embed = new EmbedBuilder()
      .setTitle("🔥 Base Strikes Series | Match Teste")
      .setDescription(
        "Um **administrador iniciou uma solicitação de partida**.\n\n" +
          "📌 **Isso é apenas um teste de botão**.\n" +
          "Clique no botão abaixo para verificar se o sistema responde corretamente."
      )
      .addFields(
        {
          name: "👑 Administrador",
          value: `<@${message.author.id}>`,
          inline: true,
        },
        {
          name: "⚙️ Status",
          value: "🟡 Aguardando interação",
          inline: true,
        }
      )
      .setColor(0xff0000)
      .setFooter({ text: "Base Strikes Series • Sistema de Matches" })
      .setTimestamp();

    // 🔘 Botão
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("match_test_button")
        .setLabel("✅ Testar Botão")
        .setStyle(ButtonStyle.Success)
    );

    const msg = await message.channel.send({
      embeds: [embed],
      components: [row],
    });

    // 🎯 Collector do botão (SEM interactionCreate)
    const collector = msg.createMessageComponentCollector({
      time: 60_000, // 1 minuto
    });

    collector.on("collect", async (interaction) => {
      await interaction.reply({
        content:
          "🎉 **BOTÃO FUNCIONOU!**\n\nSe você está vendo isso, o sistema de botões está **100% operacional** ✅",
        ephemeral: true,
      });
    });

    collector.on("end", async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("match_test_button")
          .setLabel("⏱️ Teste encerrado")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      await msg.edit({
        components: [disabledRow],
      });
    });
  },
};
