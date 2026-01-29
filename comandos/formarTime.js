const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

const CATEGORY_ID = "1466237511658377236";
const SEM_TIME_CHANNEL_ID = "1466105988938596403";

// memória temporária
const pendingTeams = new Map();

module.exports = {
  name: "formartime",

  async execute(message) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas **administradores** podem usar este comando.");
    }

    const players = message.mentions.members;

    if (players.size < 3 || players.size > 5) {
      return message.reply(
        "❌ Você deve mencionar **entre 3 e 5 jogadores**.\n" +
        "Exemplo: `.formartime @p1 @p2 @p3`"
      );
    }

    const categoria = message.guild.channels.cache.get(CATEGORY_ID);
    if (!categoria) return message.reply("❌ Categoria inválida.");

    const canal = await message.guild.channels.create({
      name: `time-${Date.now().toString().slice(-4)}`,
      type: ChannelType.GuildText,
      parent: categoria.id,
      permissionOverwrites: [
        { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        ...players.map(p => ({
          id: p.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }))
      ]
    });

    pendingTeams.set(canal.id, {
      players: players.map(p => p),
      adminId: message.author.id
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirmar_time")
        .setLabel("✅ Confirmar Time")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("cancelar_formacao")
        .setLabel("❌ Cancelar Formação")
        .setStyle(ButtonStyle.Danger)
    );

    await canal.send({
      content:
        "🔥 **FORMAÇÃO DE TIME — BASE STRIKE SERIES (BSS)** 🔥\n\n" +
        "Quando estiverem prontos:\n" +
        "✅ Confirmar Time → definir nome e oficializar\n" +
        "❌ Cancelar Formação → fechar o canal\n\n" +
        "⚠️ Apenas administradores podem usar os botões.",
      components: [row]
    });

    await message.delete().catch(() => {});
  }
};
