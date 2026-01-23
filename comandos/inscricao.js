const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");

const inscricoesAtivas = new Map();

module.exports = {
  nome: "inscricao",
  async execute(message, args) {

    // ==== CONFIGURAÇÃO: COLE OS IDS CORRETOS AQUI ====
    const CATEGORY_ID = "1463748578932687001";       
    const PUBLIC_CHANNEL_ID = "1463260829230174301"; 
    const ADMIN_CHANNEL_ID = "1463542650568179766";      
    const IGL_ROLE_ID = "1463258074310508765"; // cargo que será dado ao final
    // ================================================

    // Evita múltiplas inscrições
    if (inscricoesAtivas.has(message.author.id)) {
      return message.reply("❌ Você já tem uma inscrição em andamento.");
    }

    // Mensagem inicial no chat onde o comando foi executado
    await message.channel.send({
      content: `🔥 ${message.author} iniciou uma inscrição! Obrigado por escolher a **Base Strike Series (BSS)**! Boa sorte!`
    });

    // Cria canal privado temporário
    const channel = await message.guild.channels.create({
      name: `inscricao-temp`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: message.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: message.author.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const publicChannel = message.guild.channels.cache.get(PUBLIC_CHANNEL_ID);
    const adminChannel = message.guild.channels.cache.get(ADMIN_CHANNEL_ID);

    const maxPlayers = 8;
    const minPlayers = 5;

    // === Passo 1: Perguntar o nome do time ===
    const askTeamName = async () => {
      const embed = new EmbedBuilder()
        .setTitle("🎯 Cadastro de Equipe - Base Strike Series (BSS)")
        .setDescription("Digite o **nome do time** para iniciar a inscrição")
        .setColor("Blue");

      await channel.send({ embeds: [embed] });

      const filter = m => m.author.id === message.author.id;
      const collector = channel.createMessageCollector({ filter, time: 600000, max: 1 });

      collector.on("collect", m => {
        const teamName = m.content.trim();
        if (!teamName) {
          channel.send("❌ Nome inválido. Tente novamente.");
          return askTeamName();
        }

        // Inicia inscrição dos players
        inscricoesAtivas.set(message.author.id, { teamName, players: [] });
        channel.setName(`inscricao-${teamName}`);
        askNextPlayer(1);
      });

      collector.on("end", collected => {
        if (collected.size === 0) {
          channel.send("⏰ Tempo esgotado. Inscrição encerrada automaticamente.");
          channel.delete();
        }
      });
    };

    // === Passo 2: Perguntar os jogadores ===
    const askNextPlayer = async (playerNumber) => {
      const inscricao = inscricoesAtivas.get(message.author.id);
      if (!inscricao) return;

      if (playerNumber > maxPlayers) return finish();

      const embed = new EmbedBuilder()
        .setTitle(`👤 Cadastro PLAYER ${playerNumber}`)
        .setDescription("Responda com: **NICK, FUNÇÃO, LINK da Steam**\nApós o 5º player, digite apenas `.` se não houver mais jogadores.")
        .setColor("Purple");

      await channel.send({ embeds: [embed] });

      const filter = m => m.author.id === message.author.id;
      const collector = channel.createMessageCollector({ filter, time: 600000, max: 1 });

      collector.on("collect", m => {
        const content = m.content.trim();

        // Encerra inscrição se digitar "." após 5 players
        if (content === "." && inscricao.players.length >= minPlayers) return finish();

        const data = content.split(",").map(x => x.trim());
        if (data.length !== 3) {
          channel.send("❌ Formato inválido! Use: NICK, FUNÇÃO, LINK da Steam");
          return askNextPlayer(playerNumber);
        }

        const [nick, funcao, steam] = data;
        inscricao.players.push({ nick, funcao, steam });
        playerNumber++;

        // Aviso após o 5º player
        if (inscricao.players.length === minPlayers && playerNumber <= maxPlayers) {
          channel.send("⚠️ Já tem 5 players. Digite `.` se não houver mais jogadores, ou continue adicionando os próximos players.");
        }

        // Continua para próximo player
        askNextPlayer(playerNumber);
      });

      collector.on("end", collected => {
        if (collected.size === 0) {
          channel.send("⏰ Tempo esgotado. Inscrição encerrada automaticamente.");
          finish();
        }
      });
    };

    // === Passo 3: Finalizar inscrição ===
    const finish = async () => {
      const inscricao = inscricoesAtivas.get(message.author.id);
      if (!inscricao) return;

      // Adiciona cargo IGL de jogo ao autor
      if (IGL_ROLE_ID) {
        const role = message.guild.roles.cache.get(IGL_ROLE_ID);
        if (role) await message.member.roles.add(role).catch(() => console.log("Erro ao adicionar cargo IGL."));
      }

      // Chat público com embed bonito tipo "mini-cartão" da equipe
      if (publicChannel) {
        const embedPublic = new EmbedBuilder()
          .setTitle(`🎉 Equipe ${inscricao.teamName} Inscrita!`)
          .setColor("Green")
          .setDescription(
            `🏆 **Equipe:** ${inscricao.teamName}\n` +
            `📌 **Status:** Cadastrada no banco de dados e em análise quanto aos requisitos de jogos\n` +
            `👤 **IGL:** ${message.author}\n` +
            `🙏 Obrigado ao IGL e à equipe pela inscrição!\n` +
            `Ass: BSS Staff's`
          );

        // Adiciona mini-cartão por player
        inscricao.players.forEach((p, i) => {
          embedPublic.addFields({ name: `Player ${i+1}: ${p.nick}`, value: `Função: ${p.funcao}\nSteam: ${p.steam}` });
        });

        await publicChannel.send({ embeds: [embedPublic] });
      }

      // Chat admin com todas informações detalhadas
      if (adminChannel) {
        const embedAdmin = new EmbedBuilder()
          .setTitle(`📋 Inscrição completa da equipe: ${inscricao.teamName}`)
          .setColor("Yellow");

        inscricao.players.forEach((p, i) => {
          embedAdmin.addFields({ name: `PLAYER ${i+1}`, value: `NICK: ${p.nick}\nFUNÇÃO: ${p.funcao}\nSTEAM: ${p.steam}` });
        });

        await adminChannel.send({ embeds: [embedAdmin] });
      }

      // Deleta canal privado
      channel.delete();

      // Remove do map
      inscricoesAtivas.delete(message.author.id);
    };

    askTeamName();
  },
};
