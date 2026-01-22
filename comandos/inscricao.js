const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { salvarTimes } = require("../utils/timesStore");

module.exports = {
  nome: "inscricao",

  async execute(message) {
    // ===== CONFIGURAÇÕES =====
    const CANAL_INSCRICAO_ID = "1463260686011338814";
    const CATEGORIA_PRIVADA_ID = "1463748578932687001";
    const CARGO_IGL_ID = "1463258074310508765";
    const CANAL_ADMIN_ID = "1463542650568179766";

    // ===== RESTRIÇÕES =====
    if (message.channel.id !== CANAL_INSCRICAO_ID) {
      return message.reply("❌ Este comando só pode ser usado no canal de inscrições.");
    }

    if (!message.member.roles.cache.has(CARGO_IGL_ID)) {
      return message.reply("❌ Apenas IGLs podem utilizar este comando.");
    }

    const filter = m => m.author.id === message.author.id;

    try {
      // ===== CRIAR CANAL PRIVADO =====
      const canalPrivado = await message.guild.channels.create({
        name: `inscricao-${message.author.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORIA_PRIVADA_ID,
        permissionOverwrites: [
          { id: message.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: message.author.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      await canalPrivado.send(
        `👑 <@${message.author.id}>\n` +
        `Vamos iniciar a **inscrição da sua equipe**.\n` +
        `Responda com atenção às perguntas abaixo.`
      );

      // ===== NOME DO TIME =====
      await canalPrivado.send("🏷️ **Digite o nome da equipe:**");
      const nomeMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeMsg) return canalPrivado.send("❌ Tempo esgotado.");

      const nomeTime = nomeMsg.content;
      const jogadores = [];

      // ===== JOGADORES =====
      for (let i = 1; i <= 8; i++) {
        if (i === 6) {
          await canalPrivado.send(
            "⚠️ **Caso sua equipe não tenha 6º, 7º ou 8º jogador, envie apenas `.`**\n" +
            "_Obrigado, Administração BSS_"
          );
        }

        await canalPrivado.send(`🎮 **Player ${i} – Nick:**`);
        const nickMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!nickMsg || nickMsg.content === ".") break;

        await canalPrivado.send(`🧠 **Player ${i} – Função:**`);
        const funcaoMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();

        await canalPrivado.send(`🔗 **Player ${i} – LINK do perfil Steam:**`);
        const steamMsg = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();

        jogadores.push({
          nick: nickMsg.content,
          funcao: funcaoMsg.content,
          steam: steamMsg.content
        });
      }

      if (jogadores.length < 5) {
        return canalPrivado.send("❌ A equipe deve conter **no mínimo 5 jogadores**.");
      }

      // ===== CRIAR TIME =====
      const novoTime = {
        slot: global.timesData.length + 1,
        nome: nomeTime,
        igl: message.author.id,
        jogadores
      };

      global.timesData.push(novoTime);

      // 💾 SALVAR NO JSON (AGORA SIM)
      salvarTimes(global.timesData);

      // ===== CANAL ADMIN =====
      const canalAdmin = await message.guild.channels.fetch(CANAL_ADMIN_ID);

      let adminMsg =
        `📋 **Nova equipe cadastrada**\n\n` +
        `🏷️ **Equipe:** ${novoTime.nome}\n` +
        `👑 **IGL:** <@${novoTime.igl}>\n\n`;

      jogadores.forEach((j, i) => {
        adminMsg +=
          `**Player ${i + 1}**\n` +
          `Nick: ${j.nick}\n` +
          `Função: ${j.funcao}\n` +
          `Steam: ${j.steam}\n\n`;
      });

      canalAdmin.send(adminMsg);

      // ===== MENSAGEM FINAL NO PRIVADO =====
      await canalPrivado.send(
        `✅ **Inscrição finalizada com sucesso!**\n\n` +
        `🏆 **Equipe ${novoTime.nome} registrada na Liga BSS**\n` +
        `📞 Qualquer dúvida, entre em contato com o suporte.\n\n` +
        `_Obrigado por confiar no nosso trabalho — Administração BSS_`
      );

      // ===== MENSAGEM NO CANAL PÚBLICO =====
      await message.channel.send(
        `📢 **INSCRIÇÃO CONFIRMADA**\n\n` +
        `🏷️ **Equipe ${novoTime.nome}** foi registrada na **Liga BSS**\n` +
        `👑 IGL: <@${novoTime.igl}>\n\n` +
        `💙 A organização agradece a confiança!\n` +
        `📞 Em caso de dúvidas, procure o suporte.`
      );

    } catch (err) {
      console.error("Erro no comando inscrição:", err);
      message.reply("❌ Ocorreu um erro ao realizar a inscrição.");
    }
  }
};
