const {
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const CATEGORY_ID = "1466237511658377236";
const SEM_TIME_CHANNEL_ID = "1466105988938596403";

module.exports = {
  nome: "formartime",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const membros = message.mentions.members;

    if (membros.size < 2) {
      return message.reply(
        "❌ Mencione **pelo menos 2 players** para formar um time."
      );
    }

    await message.delete().catch(() => {});

    // 🧠 Nome automático do time (opção 2)
    const teamName = `time-${Date.now().toString().slice(-4)}`;

    // 📁 Criar canal privado
    const canal = await message.guild.channels.create({
      name: teamName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: message.guild.id,
          deny: ["ViewChannel"]
        },
        {
          id: message.author.id,
          allow: ["ViewChannel", "SendMessages"]
        },
        ...membros.map(m => ({
          id: m.id,
          allow: ["ViewChannel", "SendMessages"]
        }))
      ]
    });

    // 🎯 BOTÕES (ADMIN ONLY)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cancelar_time")
        .setLabel("❌ Cancelar formação")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("confirmar_time")
        .setLabel("✅ Time formado")
        .setStyle(ButtonStyle.Success)
    );

    const msgPrivada = await canal.send({
      content:
        `🔥 **Formação de time iniciada!**\n\n` +
        `👥 **Players selecionados:**\n` +
        membros.map(m => `• ${m}`).join("\n") +
        `\n\n🛡️ **Apenas administradores podem confirmar ou cancelar.**`,
      components: [row]
    });

    // 📣 Mensagem no chat público (#sem-time)
    const semTimeChannel = message.guild.channels.cache.get(SEM_TIME_CHANNEL_ID);
    if (semTimeChannel) {
      semTimeChannel.send(
        `✅ **Um novo time foi formado com jogadores que estavam sem equipe!**\n\n` +
        `📌 Quer montar o seu também?\n` +
        `Use o modelo abaixo neste canal:\n\n` +
        `Nick:\nFunção:\nLink perfil Steam:`
      );
    }

    // 🎮 COLLECTOR DOS BOTÕES
    const collector = msgPrivada.createMessageComponentCollector({
      time: 1000 * 60 * 30
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "❌ Apenas administradores podem usar esses botões.",
          ephemeral: true
        });
      }

      if (interaction.customId === "cancelar_time") {
        await canal.send("❌ **Formação de time cancelada por um administrador.**");
        await canal.delete();
      }

      if (interaction.customId === "confirmar_time") {
        await interaction.update({
          content:
            `✅ **TIME FORMADO COM SUCESSO!**\n\n` +
            `🏷️ Nome do time: **${teamName}**\n` +
            `👥 Players:\n${membros.map(m => `• ${m}`).join("\n")}`,
          components: []
        });
      }
    });
  }
};
