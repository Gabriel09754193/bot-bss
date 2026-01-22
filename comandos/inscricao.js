const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

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
          }
        ]
      });

      const embedInicio = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📝 Inscrição de Equipe")
        .setDescription(
          `👑 <@${message.author.id}>\n` +
          `Vamos iniciar a **inscrição da sua equipe**.\n\n` +
          `Responda às perguntas com atenção.\n` +
          `🔒 Este canal será fechado automaticamente ao final.`
        );

      await canalPrivado.send({ embeds: [embedInicio] });

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

      // ===== EMBED ADMIN =====
      const canalAdmin = await message.guild.channels.fetch(CANAL_ADMIN_ID);

      const embedAdmin = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("📋 Nova Equipe Inscrita")
        .addFields(
          { name: "Equipe", value: nomeTime },
          { name: "IGL", value: `<@${message.author.id}>` }
        );

      jogadores.forEach((j, i) => {
        embedAdmin.addFields({
          name: `Player ${i + 1}`,
          value:
            `Nick: ${j.nick}\n` +
            `Função: ${j.funcao}\n` +
            `Steam: ${j.steam}`
        });
      });

      canalAdmin.send({ embeds: [embedAdmin] });

      // ===== EMBED PÚBLICO =====
      const embedPublico = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ INSCRIÇÃO CONFIRMADA")
        .setDescription(
          `🏷️ **Equipe:** ${nomeTime}\n` +
          `👑 **IGL:** <@${message.author.id}>\n\n` +
          `💙 A organização agradece a confiança!\n` +
          `📞 Em caso de dúvidas, procure o suporte.`
        )
        .setFooter({ text: "Liga BSS • Boa sorte!" });

      await message.channel.send({ embeds: [embedPublico] });

      // ===== FINAL + FECHAR CANAL =====
      const embedFinal = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🎉 Inscrição Finalizada")
        .setDescription(
          `A equipe **${nomeTime}** foi registrada com sucesso.\n\n` +
          `🔒 Este canal será fechado em **30 segundos**.\n\n` +
          `_Obrigado, Administração BSS_`
        );

      await canalPrivado.send({ embeds: [embedFinal] });

      setTimeout(() => {
        canalPrivado.delete().catch(() => {});
      }, 30000);

    } catch (err) {
      console.error("Erro no comando inscrição:", err);
      message.reply("❌ Ocorreu um erro ao realizar a inscrição.");
    }
  }
};
