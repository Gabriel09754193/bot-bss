const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const CONFIG = {
  CATEGORY_PICKBAN_ID: "1464644395960893440",
  PUBLIC_CHANNEL_ID: "1464649761213780149",
  ADMIN_LOG_CHANNEL_ID: "1464661705417167064",
  ALLOWED_CHANNEL_ID: "1464661979133247518",

  MAPS: [
    "Mirage",
    "Inferno",
    "Nuke",
    "Overpass",
    "Ancient",
    "Anubis",
    "Vertigo"
  ]
};

module.exports = {
  name: "pickban",
  async execute(message) {
    if (message.channel.id !== CONFIG.ALLOWED_CHANNEL_ID) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar esse comando.");
    }

    const igls = message.mentions.users;
    if (igls.size !== 2) {
      return message.reply("❌ Use: `.pickban @IGL_TimeA @IGL_TimeB`");
    }

    const [iglA, iglB] = igls.map(u => u);
    const teams = [
      { user: iglA, name: "Time A" },
      { user: iglB, name: "Time B" }
    ];

    let maps = [...CONFIG.MAPS];
    let picks = [];
    let bans = [];
    let turn = Math.floor(Math.random() * 2);

    const channel = await message.guild.channels.create({
      name: `pick-ban-${iglA.username}-vs-${iglB.username}`,
      type: ChannelType.GuildText,
      parent: CONFIG.CATEGORY_PICKBAN_ID,
      permissionOverwrites: [
        {
          id: message.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: iglA.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        },
        {
          id: iglB.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    const publicChannel = message.guild.channels.cache.get(CONFIG.PUBLIC_CHANNEL_ID);
    const logChannel = message.guild.channels.cache.get(CONFIG.ADMIN_LOG_CHANNEL_ID);

    await channel.send(`🎲 **Sorteio:** ${teams[turn].user} começa o veto!`);

    async function updatePublic(text) {
      if (publicChannel) await publicChannel.send(text);
      if (logChannel) await logChannel.send(text);
    }

    async function nextStep(type) {
      const current = teams[turn];
      const row = new ActionRowBuilder();

      maps.forEach(map => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`${type}_${map}`)
            .setLabel(map)
            .setStyle(type === "ban" ? ButtonStyle.Danger : ButtonStyle.Success)
        );
      });

      await channel.send({
        content: `👉 ${current.user}, escolha um **${type.toUpperCase()}**`,
        components: [row]
      });
    }

    let phase = "ban"; // ban → pick → ban
    let actionCount = 0;

    const collector = channel.createMessageComponentCollector({ time: 15 * 60 * 1000 });

    collector.on("collect", async interaction => {
      if (interaction.user.id !== teams[turn].user.id) {
        return interaction.reply({ content: "❌ Não é sua vez.", ephemeral: true });
      }

      const [type, map] = interaction.customId.split("_");
      maps = maps.filter(m => m !== map);

      if (type === "ban") bans.push({ team: teams[turn].name, map });
      if (type === "pick") picks.push({ team: teams[turn].name, map });

      await updatePublic(`🗺️ **${teams[turn].name} ${type.toUpperCase()}OU ${map}**`);

      turn = turn === 0 ? 1 : 0;
      actionCount++;

      await interaction.update({ components: [] });

      if (actionCount === 2) phase = "pick";
      if (actionCount === 4) phase = "ban";
      if (actionCount === 6) {
        collector.stop();
        const decider = maps[0];
        const side = Math.random() > 0.5 ? "CT" : "TR";
        await updatePublic(`🔥 **Mapa decisivo:** ${decider}\n🎯 **Lado sorteado:** ${side}`);
        await channel.send("✅ Pick/Ban finalizado. Canal será fechado.");
        setTimeout(() => channel.delete(), 10000);
        return;
      }

      await nextStep(phase);
    });

    await nextStep("ban");
  }
};
