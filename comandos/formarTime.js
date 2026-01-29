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
      return;
    }

    const membros = message.mentions.members;
    if (membros.size < 2) {
      return message.reply("❌ Mencione os players para iniciar a formação.");
    }

    await message.delete().catch(() => {});

    // 📣 Aviso público
    message.channel.send(
      `🛠️ **FORMAÇÃO DE EQUIPE INICIADA**\n` +
      `👑 Administrador ${message.author} iniciou a formação de uma equipe.\n` +
      `👥 Players estão em **processo de desenvolvimento do time**.\n\n` +
      `⏳ Em breve novidades no **#sem-time**.`
    );

    const canal = await message.guild.channels.create({
      name: `formacao-time`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: message.guild.id, deny: ["ViewChannel"] },
        { id: message.author.id, allow: ["ViewChannel", "SendMessages"] },
        ...membros.map(m => ({
          id: m.id,
          allow: ["ViewChannel", "SendMessages"]
        }))
      ]
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cancelar")
        .setLabel("❌ Cancelar formação")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("confirmar")
        .setLabel("✅ Time formado")
        .setStyle(ButtonStyle.Success)
    );

    const msg = await canal.send({
      content:
        `🔥 **BEM-VINDOS À FORMAÇÃO DE EQUIPE – BSS**\n\n` +
        `Este canal existe para criar um **TIME DE VERDADE**.\n\n` +
        `🎯 Não é só para jogar a liga.\n` +
        `👉 É para treinar, evoluir, criar comunicação e união.\n\n` +
        `📢 **Obrigatório:** definir meio de comunicação e jogar juntos.\n` +
        `⏳ Este chat ficará aberto por alguns dias.\n\n` +
        `🛡️ Quando estiver tudo certo, um **ADMIN** deve confirmar.`,
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 1000 * 60 * 60 });

    collector.on("collect", async (i) => {
      if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return i.reply({ content: "❌ Apenas administradores.", ephemeral: true });
      }

      if (i.customId === "cancelar") {
        const ch = message.guild.channels.cache.get(SEM_TIME_CHANNEL_ID);
        if (ch) {
          ch.send(
            `❌ **FORMAÇÃO DE EQUIPE CANCELADA**\n\n` +
            `Players continuam livres para novas formações.\n\n` +
            `Modelo:\nNick:\nFunção:\nLink perfil Steam:`
          );
        }
        await canal.delete();
      }

      if (i.customId === "confirmar") {
        await canal.send(
          `📝 **CONFIRMAÇÃO FINAL**\n\n` +
          `Administrador, responda neste formato:\n\n` +
          `Nome do Time:\n` +
          `Player 1 – Nick:\nPlayer 2 – Nick:\nPlayer 3 – Nick:\nPlayer 4 – Nick:\nPlayer 5 – Nick:`
        );

        collector.stop();
      }
    });
  }
};
