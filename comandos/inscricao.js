const {
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require("discord.js");

// ⚠️ IMPORTANTE: isso será compartilhado com o comando .times
// Se você já tem um arquivo timesData.js, adapte depois
const timesData = global.timesData || [];
global.timesData = timesData;

module.exports = {
  nome: "inscricao",

  async execute(message) {
    try {
      // ================= CONFIGURAÇÕES =================
      const CANAL_INSCRICAO_ID = "1463260686011338814"; // canal onde pode usar .inscricao
      const CARGO_IGL_ID = "1463258074310508765"; // cargo IGL
      const CATEGORIA_INSC_ID = "1463748578932687001"; // categoria dos canais privados
      const CANAL_ADMIN_ID = "1463542650568179766"; // canal admin
      const CANAL_PUBLICO_ID = "1463260686011338814"; // canal público
      const LIMITE_TIMES = 16;
      // =================================================

      // 🔒 Canal correto
      if (message.channel.id !== CANAL_INSCRICAO_ID) {
        return message.reply("❌ Este comando só pode ser usado no canal de inscrições.");
      }

      // 🔒 Apenas IGL
      if (!message.member.roles.cache.has(CARGO_IGL_ID)) {
        return message.reply("❌ Apenas **IGLs** podem realizar a inscrição.");
      }

      // 🔒 Limite de times
      if (timesData.length >= LIMITE_TIMES) {
        return message.reply("❌ O limite de equipes já foi atingido.");
      }

      // 🧹 Apaga o comando
      await message.delete();

      // 📂 Cria canal privado
      const canalPrivado = await message.guild.channels.create({
        name: `inscricao-${message.author.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORIA_INSC_ID,
        permissionOverwrites: [
          {
            id: message.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: message.author.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages
            ]
          },
          {
            id: message.guild.roles.cache.find(r => r.permissions.has(PermissionFlagsBits.Administrator)).id,
            allow: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });

      const filter = m => m.author.id === message.author.id;

      await canalPrivado.send("🎯 **Bem-vindo à inscrição da Liga!**\nResponda tudo com atenção.");

      // ================= NOME DO TIME =================
      await canalPrivado.send("🏷️ **Nome da equipe:**");
      const nomeTimeMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return canalPrivado.send("❌ Tempo esgotado.");
      const nomeTime = nomeTimeMsg.content;
      await nomeTimeMsg.delete();

      // ================= JOGADORES =================
      const jogadores = [];

      for (let i = 1; i <= 8; i++) {
        if (i === 6) {
          await canalPrivado.send(
            "⚠️ **ATENÇÃO:** Caso sua equipe não tenha 6º, 7º ou 8º player,\n" +
            "digite apenas **`.`** nas próximas perguntas.\n\n🙏 Obrigado, Administração BSS"
          );
        }

        await canalPrivado.send(`👤 **Player ${i} – Nick:**`);
        const nickMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!nickMsg) return canalPrivado.send("❌ Tempo esgotado.");

        const nick = nickMsg.content;
        await nickMsg.delete();

        if (nick === "." && i >= 6) break;

        await canalPrivado.send(`🎮 **Player ${i} – Função:**`);
        const funcMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!funcMsg) return canalPrivado.send("❌ Tempo esgotado.");
        const funcao = funcMsg.content;
        await funcMsg.delete();

        await canalPrivado.send(`🔗 **Player ${i} – LINK do perfil Steam:**`);
        const steamMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!steamMsg) return canalPrivado.send("❌ Tempo esgotado.");
        const steam = steamMsg.content;
        await steamMsg.delete();

        jogadores.push({ nick, funcao, steam });
      }

      // ================= REGISTRAR TIME =================
      const slotLivre = timesData.length + 1;

      const timeFinal = {
        slot: slotLivre,
        nome: nomeTime,
        igl: message.author.id,
        jogadores
      };

      timesData.push(timeFinal);

      // ================= CANAL ADMIN =================
      const canalAdmin = await message.guild.channels.fetch(CANAL_ADMIN_ID);

      let adminMsg = `📋 **NOVA INSCRIÇÃO**\n\n🏷️ **Equipe:** ${nomeTime}\n👑 **IGL:** <@${message.author.id}>\n\n`;

      jogadores.forEach((j, i) => {
        adminMsg += `**Player ${i + 1}**\nNick: ${j.nick}\nFunção: ${j.funcao}\nSteam: ${j.steam}\n\n`;
      });

      await canalAdmin.send(adminMsg);

      // ================= CANAL PÚBLICO =================
      const canalPublico = await message.guild.channels.fetch(CANAL_PUBLICO_ID);

      const embedPublico = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ EQUIPE REGISTRADA")
        .setDescription(
          `🏆 **Equipe ${nomeTime} registrada com sucesso na Liga BSS!**\n\n` +
          `📌 Qualquer dúvida, entre em contato com o suporte.\n` +
          `💚 Boa sorte na competição!`
        )
        .setFooter({ text: "Administração BSS" });

      await canalPublico.send({ embeds: [embedPublico] });

      // ================= FINAL =================
      await canalPrivado.send("✅ **Inscrição concluída com sucesso!**\nEste canal será fechado.");
      setTimeout(() => canalPrivado.delete(), 10000);

    } catch (err) {
      console.error("Erro no .inscricao:", err);
      message.channel.send("❌ Ocorreu um erro durante a inscrição.");
    }
  }
};
