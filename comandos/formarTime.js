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

    // 🔐 SOMENTE ADMIN
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const players = message.mentions.users;

    if (players.size !== 5) {
      return message.reply("❌ Você deve mencionar exatamente **5 players**.");
    }

    // 🧹 Apaga o comando
    await message.delete().catch(() => {});

    // 🧩 Cria canal privado
    const canal = await message.guild.channels.create({
      name: `🧩-formacao-time-${Date.now().toString().slice(-4)}`,
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

    // 📢 MENSAGEM PÚBLICA
    await message.channel.send({
      content: `📢 **COMUNICADO — BASE STRIKE SERIES (BSS)**

A administração da Base Strike Series (BSS) realizou a junção
e a integração de players para a formação de um novo time.

🔒 Um chat privado foi criado para organização da equipe.

Boa sorte aos envolvidos! 🎮🔥`
    });

    // 🔘 BOTÕES (ADM ONLY)
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

Este canal foi criado pela administração da BSS para que vocês
possam conversar e formar sua equipe de maneira organizada.

📌 **O que definir aqui:**
• Nome do time  
• IGL / liderança  
• Compromisso e horários  

⏳ Prazo recomendado: **24 horas**

⚠️ **Atenção:**  
Apenas a administração pode finalizar ou cancelar esta formação.`,
      components: [row]
    });

    // 🎯 COLETOR DOS BOTÕES
    const collector = msg.createMessageComponentCollector();

    collector.on("collect", async interaction => {

      // 🔐 SOMENTE ADMIN CLICA
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "❌ Apenas administradores podem usar estes botões.",
          ephemeral: true
        });
      }

      // ✅ TIME FORMADO
      if (interaction.customId === "time_formado") {

        await interaction.reply({
          content: "✅ **Time formado e aprovado pela administração.**"
        });

        await canal.send({
          content: `🟢 **TIME FORMADO — BSS**

Esta formação foi finalizada e aprovada oficialmente
pela administração da Base Strike Series.

Desejamos sucesso ao time no campeonato! 🎮🔥`
        });

        await message.channel.send({
          content: `📢 **COMUNICADO — BSS**

Um novo time foi **formado com sucesso** e aprovado
pela administração da Base Strike Series.`
        });

        // 🔒 BLOQUEIA O CANAL
        await canal.permissionOverwrites.edit(message.guild.id, {
          ViewChannel: false
        });

        for (const user of players.values()) {
          await canal.permissionOverwrites.edit(user.id, {
            SendMessages: false
          });
        }
      }

      // ❌ CANCELAR FORMAÇÃO
      if (interaction.customId === "cancelar_formacao") {

        await interaction.reply({
          content: "❌ **Formação de time cancelada pela administração.**"
        });

        await message.channel.send({
          content: `📢 **COMUNICADO — BSS**

Uma formação de time foi **cancelada pela administração**.`
        });

        setTimeout(() => {
          canal.delete().catch(() => {});
        }, 3000);
      }
    });
  }
};
