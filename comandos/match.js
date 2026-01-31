const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

const CONFIG = {
  partidasEmEspera: "1463270089376927845",
  pickbanPublico: "1464649761213780149",
  amistosos: "1466989903232499712",
  categoriaMatch: "1463562210591637605",
};

const MAP_POOL_BASE = [
  "Mirage",
  "Inferno",
  "Nuke",
  "Overpass",
  "Ancient",
  "Anubis",
  "Dust2",
];

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    const guild = message.guild;
    const canalEspera = guild.channels.cache.get(CONFIG.partidasEmEspera);
    if (!canalEspera)
      return message.reply("❌ Canal de partidas em espera não encontrado.");

    const iglA = message.author;

    // ===== PERGUNTAR NOME DO TIME A =====
    await message.reply("🛡️ **BSS** | Digite o **nome completo do seu time**:");

    const filterA = (m) => m.author.id === iglA.id;
    const coletorA = await message.channel.awaitMessages({
      filter: filterA,
      max: 1,
      time: 60000,
    });

    if (!coletorA.size)
      return message.reply("❌ Tempo esgotado. Use `.match` novamente.");

    const timeA = coletorA.first().content;

    // ===== SOLICITAÇÃO EM PARTIDAS EM ESPERA =====
    const embedSolicitacao = new EmbedBuilder()
      .setTitle("⚔️ Base Strikes Series | Partida em Espera")
      .setDescription("Um time está buscando confronto!")
      .addFields(
        { name: "🛡️ Time", value: timeA, inline: true },
        { name: "👑 IGL", value: `${iglA}`, inline: true },
        { name: "⏳ Status", value: "Aguardando aceite", inline: true }
      )
      .setColor(0xff0000)
      .setFooter({ text: "BSS • Sistema de Matches" });

    const rowAceite = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("aceitar_match")
        .setLabel("⚔️ Aceitar Partida")
        .setStyle(ButtonStyle.Success)
    );

    const msgSolicitacao = await canalEspera.send({
      embeds: [embedSolicitacao],
      components: [rowAceite],
    });

    // ===== COLLECTOR ACEITE =====
    const collectorAceite = msgSolicitacao.createMessageComponentCollector();

    collectorAceite.on("collect", async (interaction) => {
      if (interaction.user.id === iglA.id)
        return interaction.reply({
          content: "❌ Você não pode aceitar sua própria partida.",
          ephemeral: true,
        });

      const iglB = interaction.user;

      // ===== PERGUNTAR TIME B NO CHAT =====
      await interaction.reply({
        content: `🛡️ **BSS** | ${iglB}, digite o **nome completo do seu time** no chat para confirmar a partida:`,
        ephemeral: false,
      });

      const filterB = (m) => m.author.id === iglB.id;
      const coletorB = await canalEspera.awaitMessages({
        filter: filterB,
        max: 1,
        time: 60000,
      });

      if (!coletorB.size)
        return canalEspera.send(
          "❌ Tempo esgotado para informar o nome do time."
        );

      const timeB = coletorB.first().content;

      collectorAceite.stop();
      await msgSolicitacao.edit({ components: [] });

      // ===== CRIAR CHAT PRIVADO =====
      const matchChannel = await guild.channels.create({
        name: `match-${timeA}-vs-${timeB}`.toLowerCase().replace(/ /g, "-"),
        type: ChannelType.GuildText,
        parent: CONFIG.categoriaMatch || null,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: iglA.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
          {
            id: iglB.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
        ],
      });

      await canalEspera.send(
        `✅ **Match criada:** ${timeA} 🆚 ${timeB}`
      );

      await matchChannel.send({
        content: `📢 **BSS** | Bem-vindos ao chat da partida!\n\n` +
          `Aqui vocês vão realizar **Pick/Ban** do confronto.\n` +
          `O bot vai guiar passo a passo e orientar quem deve agir.\n` +
          `Somente o IGL da vez poderá clicar nos botões.\n` +
          `Lembrem-se: treinar juntos, criar comunicação e jogar como um time de verdade!`,
      });

      // ===== PICK/BAN =====
      let mapPool = [...MAP_POOL_BASE];
      let bans = [];
      let picks = [];
      let turno = Math.random() < 0.5 ? "A" : "B";

      const embedPB = new EmbedBuilder()
        .setTitle("🗺️ BSS | Pick & Ban")
        .setDescription(
          `🔴 **${timeA}** vs 🔵 **${timeB}**\n\n` +
            `❌ Bans: ${bans.join(", ") || "Nenhum"}\n` +
            `🎯 Picks: ${picks.join(", ") || "Nenhum"}\n` +
            `⏳ Vez do: ${turno === "A" ? timeA : timeB}`
        )
        .setColor(0xff0000);

      const gerarBotoes = () => {
        return new ActionRowBuilder().addComponents(
          mapPool.map((map) =>
            new ButtonBuilder()
              .setCustomId(`ban_${map}`)
              .setLabel(map)
              .setStyle(ButtonStyle.Danger)
          )
        );
      };

      const msgPB = await matchChannel.send({
        embeds: [embedPB],
        components: [gerarBotoes()],
      });

      const pbCollector = msgPB.createMessageComponentCollector();

      pbCollector.on("collect", async (btn) => {
        const autor = btn.user.id === iglA.id ? "A" : btn.user.id === iglB.id ? "B" : null;
        if (!autor || autor !== turno)
          return btn.reply({ content: "❌ Não é sua vez.", ephemeral: true });

        const mapa = btn.customId.replace("ban_", "");
        mapPool = mapPool.filter((m) => m !== mapa);
        bans.push(mapa);

        await guild.channels.cache
          .get(CONFIG.pickbanPublico)
          .send(`❌ **${autor === "A" ? timeA : timeB}** baniu **${mapa}**`);

        turno = turno === "A" ? "B" : "A";

        // Atualiza embed
        embedPB.setDescription(
          `🔴 **${timeA}** vs 🔵 **${timeB}**\n\n` +
            `❌ Bans: ${bans.join(", ")}\n` +
            `🎯 Picks: ${picks.join(", ") || "Nenhum"}\n` +
            `⏳ Vez do: ${turno === "A" ? timeA : timeB}`
        );

        if (mapPool.length === 1) {
          pbCollector.stop();
          await msgPB.edit({ components: [] });
          await matchChannel.send(`🎯 **Mapa final definido:** **${mapPool[0]}**`);
          await guild.channels.cache
            .get(CONFIG.amistosos)
            .send(
              `⚔️ **PARTIDA CONFIRMADA — BSS**\n\n${timeA} 🆚 ${timeB}\n🗺️ Mapa final: **${mapPool[0]}**`
            );
          return;
        }

        await msgPB.edit({ embeds: [embedPB], components: [gerarBotoes()] });
        btn.deferUpdate();
      });
    });
  },
};
