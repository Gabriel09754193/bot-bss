const {
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const CATEGORIA_ID = "1466237511658377236";

module.exports = {
  name: "formarTime",
  async execute(client, message, args) {
    try {
      // 🔐 Somente ADMIN
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.channel.send("❌ Apenas administradores podem usar este comando.");
      }

      // 👥 Players mencionados (2 a 5)
      const players = message.mentions.users;

      if (players.size < 2 || players.size > 5) {
        return message.channel.send(
          "❌ Você deve mencionar **entre 2 e 5 players** para formar um time."
        );
      }

      // 🧹 Apaga o comando
      await message.delete().catch(() => {});

      // 🧩 Cria canal privado
      const canal = await message.guild.channels.create({
        name: `🧩-formacao-time-${Math.floor(Math.random() * 9999)}`,
        type: ChannelType.GuildText,
        parent: CATEGORIA_ID,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: message.author.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ],
          },
          ...players.map(user => ({
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ],
          }))
        ],
      });

      // 📢 Mensagem pública
      await message.channel.send({
        content: `📢 **COMUNICADO — BASE STRIKE SERIES (BSS)**

A administração da Base Strike Series (BSS) realizou a junção
de players para a formação de um novo time.

🔒 Um chat privado foi criado para organização da equipe.

Boa sorte aos envolvidos! 🎮🔥`
      });

      // 🔘 Botões (ADM ONLY)
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("time_formado")
          .setLabel("Time Formado")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId("cancelar_formacao")
          .setLabel("Cancelar Formação")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("❌")
      );

      const mentions = players.map(p => `<@${p.id}>`).join("\n");

      const msg = await canal.send({
        content: `🔒 **FORMAÇÃO DE TIME — BASE STRIKE SERIES (BSS)**

👥 **Players selecionados:**
${mentions}

Este canal foi criado pela administração da BSS
para que vocês possam conversar e formar sua equipe.

📌 **Definam aqui:**
• Nome do time  
• IGL / liderança  
• Compromisso com a liga  

⚠️ Apenas administradores podem finalizar ou cancelar.`,
        components: [row]
      });

      // 🎯 Botões
      const collector = msg.createMessageComponentCollector();

      collector.on("collect", async interaction => {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({
            content: "❌ Apenas administradores podem usar estes botões.",
            ephemeral: true
          });
        }

        // ✅ TIME FORMADO
        if (interaction.customId === "time_formado") {
          await interaction.reply("✅ **Time formado e aprovado pela administração.**");

          await canal.send({
            content: `🟢 **TIME FORMADO — BSS**

Esta formação foi finalizada e aprovada oficialmente
pela administração da Base Strike Series.

Boa sorte no campeonato! 🎮🔥`
          });

          await message.channel.send({
            content: `📢 **COMUNICADO — BSS**

Um novo time foi **formado com sucesso** e aprovado
pela administração da Base Strike Series.`
          });

          // 🔒 Bloqueia mensagens dos players
          for (const user of players.values()) {
            await canal.permissionOverwrites.edit(user.id, {
              SendMessages: false
            });
          }
        }

        // ❌ CANCELAR
        if (interaction.customId === "cancelar_formacao") {
          await interaction.reply("❌ **Formação de time cancelada pela administração.**");

          await message.channel.send({
            content: `📢 **COMUNICADO — BSS**

Uma formação de time foi **cancelada pela administração**.`
          });

          setTimeout(() => {
            canal.delete().catch(() => {});
          }, 3000);
        }
      });

    } catch (err) {
      console.error(err);
      message.channel.send("❌ Ocorreu um erro ao criar a formação do time.");
    }
  }
};
