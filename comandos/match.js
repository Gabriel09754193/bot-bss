const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply("❌ Apenas **IGLs / Admins** podem iniciar uma partida.");
    }

    const perguntas = [
      "🏷️ **Qual o nome completo do seu time?**",
      "🎮 **Formato da partida?** (`md1` ou `md3`)",
      "🕒 **Disponibilidade do time** (ex: Seg à Sex — 19h às 22h)"
    ];

    let respostas = [];
    let etapa = 0;

    const perguntaEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("🎮 CRIAÇÃO DE PARTIDA — BSS")
      .setDescription(perguntas[etapa])
      .setFooter({ text: "Base Strikes Series" });

    await message.channel.send({ embeds: [perguntaEmbed] });

    const collector = message.channel.createMessageCollector({
      filter: m => m.author.id === message.author.id,
      max: 3,
      time: 120000
    });

    collector.on("collect", async (msg) => {
      respostas.push(msg.content);
      etapa++;

      if (etapa < perguntas.length) {
        perguntaEmbed.setDescription(perguntas[etapa]);
        await message.channel.send({ embeds: [perguntaEmbed] });
      }
    });

    collector.on("end", async (collected) => {
      if (respostas.length < 3) {
        return message.channel.send("❌ Tempo esgotado. Use `.match` novamente.");
      }

      const [nomeTime, formato, disponibilidade] = respostas;

      const embedPublico = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("🕒 PARTIDA EM ESPERA — BSS")
        .addFields(
          { name: "Equipe solicitante", value: nomeTime },
          { name: "Formato", value: formato.toUpperCase() },
          { name: "Disponibilidade", value: disponibilidade }
        )
        .setFooter({ text: "Aguardando outro IGL aceitar" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("aceitar_match")
          .setLabel("✅ Aceitar partida")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("fechar_match")
          .setLabel("❌ Fechar solicitação (ADM)")
          .setStyle(ButtonStyle.Danger)
      );

      const msgPublica = await message.channel.send({
        embeds: [embedPublico],
        components: [row]
      });

      const buttonCollector = msgPublica.createMessageComponentCollector({
        time: 86400000
      });

      buttonCollector.on("collect", async (interaction) => {
        if (interaction.customId === "fechar_match") {
          if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: "❌ Apenas admins.", ephemeral: true });
          }

          await interaction.update({
            content: "❌ Solicitação encerrada por um administrador.",
            embeds: [],
            components: []
          });
          return;
        }

        if (interaction.customId === "aceitar_match") {
          await interaction.deferUpdate();

          const guild = message.guild;

          const canalPrivado = await guild.channels.create({
            name: `match-${Date.now()}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                id: guild.roles.everyone,
                deny: [PermissionsBitField.Flags.ViewChannel]
              },
              {
                id: message.author.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
              },
              {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
              }
            ]
          });

          const embedPrivado = new EmbedBuilder()
            .setColor("#ff8800")
            .setTitle("🔒 CHAT PRIVADO DE PARTIDA — BSS")
            .setDescription(
              `🆚 **Equipes em desenvolvimento**\n\n` +
              `🎮 **Formato:** ${formato.toUpperCase()}\n\n` +
              `📌 Use este chat para:\n` +
              `• Organizar a partida\n` +
              `• Fazer Pick/Ban\n` +
              `• Registrar resultado\n\n` +
              `⚠️ **Botões abaixo são apenas para ADM**`
            );

          const rowPrivado = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("pickban")
              .setLabel("🎲 Iniciar Pick/Ban (ADM)")
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setCustomId("resultado")
              .setLabel("🏁 Inserir Resultado (ADM)")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId("cancelar")
              .setLabel("❌ Cancelar Partida (ADM)")
              .setStyle(ButtonStyle.Danger)
          );

          await canalPrivado.send({
            embeds: [embedPrivado],
            components: [rowPrivado]
          });

          await msgPublica.edit({
            content: "✅ Partida aceita! Chat privado criado.",
            embeds: [],
            components: []
          });
        }
      });
    });
  }
};
