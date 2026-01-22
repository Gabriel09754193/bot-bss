const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { salvarTimes } = require("../utils/timesStore");

module.exports = {
  nome: "inscricao",

  async execute(message) {
    // 🔧 CONFIGURAÇÃO
    const CANAL_INSCRICAO_ID = "1463260686011338814";
    const CATEGORIA_PRIVADA_ID = "1463748578932687001";
    const CARGO_IGL_ID = "1463258074310508765";
    const CANAL_ADMIN_ID = "1463542650568179766";

    // 🔒 Apenas no canal correto
    if (message.channel.id !== CANAL_INSCRICAO_ID) {
      return message.reply("❌ Este comando só pode ser usado no canal de inscrições.");
    }

    // 🔒 Apenas IGL
    if (!message.member.roles.cache.has(CARGO_IGL_ID)) {
      return message.reply("❌ Apenas IGLs podem realizar inscrições.");
    }

    const filter = m => m.author.id === message.author.id;

    try {
      // Criar canal privado
      const canalPrivado = await message.guild.channels.create({
        name: `inscricao-${message.author.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORIA_PRIVADA_ID,
        permissionOverwrites: [
          { id: message.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: message.author.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      await canalPrivado.send(`👑 <@${message.author.id}>, vamos iniciar sua inscrição!`);

      // Nome do time
      await canalPrivado.send("🏷️ **Digite o nome da equipe:**");
      const nomeTime = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTime) return canalPrivado.send("❌ Tempo esgotado.");

      const jogadores = [];

      // Jogadores (1 a 8)
      for (let i = 1; i <= 8; i++) {
        if (i === 6) {
          await canalPrivado.send("⚠️ **Caso não tenha mais jogadores, envie apenas `.`**\n_Antenciosamente, Administração BSS_");
        }

        await canalPrivado.send(`🎮 **Player ${i} - Nick:**`);
        const nick = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!nick || nick.content === ".") break;

        await canalPrivado.send(`🧠 **Player ${i} - Função:**`);
        const funcao = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();

        await canalPrivado.send(`🔗 **Player ${i} - Link do perfil Steam:**`);
        const steam = (await canalPrivado.awaitMessages({ filter, max: 1, time: 60000 })).first();

        jogadores.push({
          nick: nick.content,
          funcao: funcao.content,
          steam: steam.content
        });
      }

      if (jogadores.length < 5) {
        return canalPrivado.send("❌ A equipe deve ter no mínimo 5 jogadores.");
      }

      // Criar time
      const novoTime = {
        slot: global.timesData.length + 1,
        nome: nomeTime.content,
        igl: message.author.id,
        jogadores
      };

      global.timesData.push(novoTime);

      // 💾 SALVAR NO JSON (AQUI ESTAVA O PROBLEMA)
      salvarTimes(global.timesData);

      // Enviar para admin
      const canalAdmin = await message.guild.channels.fetch(CANAL_ADMIN_ID);
      let texto = `📋 **Nova equipe cadastrada**\n\n🏷️ **${novoTime.nome}**\n👑 IGL: <@${novoTime.igl}>\n\n`;

      jogadores.forEach((j, i) => {
        texto += `**${i + 1}. ${j.nick}** (${j.funcao})\n${j.steam}\n\n`;
      });

      canalAdmin.send(texto);

      await canalPrivado.send(
        `✅ **Equipe registrada com sucesso!**\n\n` +
        `🏆 **Equipe ${novoTime.nome} registrada na Liga BSS**\n` +
        `📞 Qualquer dúvida entre em contato com o suporte.\n\n` +
        `_Obrigado, Administração BSS_`
      );

    } catch (err) {
      console.error("Erro inscrição:", err);
      message.reply("❌ Ocorreu um erro ao realizar a inscrição.");
    }
  }
};
