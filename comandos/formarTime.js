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
    // 🔒 Apenas ADMIN
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return;
    }

    const membros = message.mentions.members;
    if (membros.size < 2) {
      return message.reply("❌ Mencione os players para iniciar a formação.");
    }

    // 🧹 Apaga o comando
    await message.delete().catch(() => {});

    // 📣 Mensagem no chat público
    await message.channel.send(
      `🛠️ **FORMAÇÃO DE EQUIPE INICIADA**\n` +
      `👑 Administrador ${message.author} iniciou a formação de uma equipe.\n` +
      `👥 Os players selecionados já estão em processo de organização.\n\n` +
      `⏳ Aguarde novidades no **#sem-time**.`
    );

    // 📂 Criar canal privado
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

    // 🔘 Botões (ADMIN ONLY)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cancelar_formacao")
        .setLabel("❌ Cancelar formação (ADMIN)")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("confirmar_formacao")
        .setLabel("✅ Confirmar time (ADMIN)")
        .setStyle(ButtonStyle.Success)
    );

    const msg = await canal.send({
      content:
        `🔥 **BEM-VINDOS À FORMAÇÃO DE EQUIPE – BSS**\n\n` +
        `Este canal foi criado para formar um **TIME DE VERDADE**.\n\n` +
        `🎯 Não é apenas para jogar a liga.\n` +
        `👉 É para treinar juntos, evoluir e criar união.\n\n` +
        `📢 **Obrigatório:** definir meio de comunicação.\n` +
        `⏳ Este chat ficará aberto por alguns dias.\n\n` +
        `🛡️ **Somente ADMINISTRADORES** podem usar os botões abaixo.`,
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({
      time: 1000 * 60 * 60 * 24 // 24h
    });

    collector.on("collect", async (interaction) => {
      // 🔒 Segurança extra
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "❌ Apenas administradores podem usar esses botões.",
          ephemeral: true
        });
      }

      const semTime = message.guild.channels.cache.get(SEM_TIME_CHANNEL_ID);

      // ❌ Cancelar
      if (interaction.customId === "cancelar_formacao") {
        if (semTime) {
          semTime.send(
            `❌ **FORMAÇÃO DE EQUIPE CANCELADA**\n\n` +
            `A tentativa de formação foi encerrada por um administrador.\n\n` +
            `✍️ Players continuam livres. Use o modelo abaixo:\n` +
            `\`\`\`\nNick:\nFunção:\nLink perfil Steam:\n\`\`\``
          );
        }

        collector.stop();
        await canal.delete().catch(() => {});
      }

      // ✅ Confirmar
      if (interaction.customId === "confirmar_formacao") {
        if (semTime) {
          semTime.send(
            `✅ **EQUIPE FORMADA COM SUCESSO!**\n\n` +
            `Uma nova equipe foi formada através do sistema da **Base Strike Series**.\n\n` +
            `🔥 Desejamos boa sorte aos players!\n\n` +
            `👀 Quer formar um time também?\n` +
            `Use o modelo abaixo:\n` +
            `\`\`\`\nNick:\nFunção:\nLink perfil Steam:\n\`\`\``
          );
        }

        collector.stop();
        await canal.delete().catch(() => {});
      }
    });
  }
};
