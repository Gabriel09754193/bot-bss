const { EmbedBuilder } = require('discord.js');

module.exports = {
  nome: 'inscricao',
  descricao: 'Cadastrar um time na liga',

  async execute(message, args, client) {
    try {
      const timesCommand = client.commands.get('times');
      if (!timesCommand) return message.channel.send('❌ Comando .times não encontrado.');

      const filter = m => m.author.id === message.author.id;
      const MAX_JOGADORES = 8;
      const SUPORTE_CANAL_ID = '1463261657798283351'; // Substitua pelo canal de suporte
      const CANAL_INSCRICAO_ID = '1463260686011338814'; // Substitua pelo canal de inscrição

      // Somente no canal correto
      if (message.channel.id !== CANAL_INSCRICAO_ID) {
        return message.reply(`❌ Este comando só pode ser usado no canal de inscrição.`);
      }

      // --- Pergunta 1: Nome do time ---
      const msgTime = await message.channel.send('🎯 **Digite o nome do seu time:**');
      const nomeTimeMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return message.channel.send('❌ Tempo esgotado.');
      const nomeTime = nomeTimeMsg.content;
      await nomeTimeMsg.delete();
      await msgTime.delete();

      // --- Pergunta 2: Jogadores ---
      const jogadores = [];
      for (let i = 1; i <= MAX_JOGADORES; i++) {
        const msgJogador = await message.channel.send(`👤 **Digite o nick do jogador ${i}** (ou '.' se não houver):`);
        const resposta = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!resposta) return message.channel.send('❌ Tempo esgotado.');
        jogadores.push(resposta.content);
        await resposta.delete();
        await msgJogador.delete();

        // Aviso após 5 jogadores
        if (i === 5) {
          await message.channel.send('⚠️ Caso sua equipe não tenha 6º, 7º ou 8º jogador, apenas digite `.` nas próximas perguntas. Obrigado! - Administração BSS');
        }
      }

      // --- Pergunta 3: Perfis Steam ---
      const perfisSteam = [];
      for (let i = 0; i < MAX_JOGADORES; i++) {
        if (jogadores[i] === '.') {
          perfisSteam.push('.');
          continue;
        }
        const msgSteam = await message.channel.send(`💻 **Digite o perfil Steam do jogador ${i + 1}:**`);
        const steamResposta = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!steamResposta) return message.channel.send('❌ Tempo esgotado.');
        perfisSteam.push(steamResposta.content);
        await steamResposta.delete();
        await msgSteam.delete();
      }

      // --- Salvar no Map do .times ---
      timesCommand.timesPendentes.set(message.author.id, {
        criador: message.author.id,
        nomeTime,
        jogadores,
        perfisSteam
      });

      // --- Mensagem final pública ---
      const canalSuporte = await message.guild.channels.fetch(SUPORTE_CANAL_ID);
      const embedPublico = new EmbedBuilder()
        .setTitle('✅ Equipe Registrada!')
        .setColor('Green')
        .setDescription(`🎉 Equipe **${nomeTime}** registrada na **Liga BSS**!\n\n📌 Para dúvidas, entre em contato com ${canalSuporte}`)
        .addFields(
          { name: 'IGL', value: `<@${message.author.id}>`, inline: true },
          { name: 'Jogadores', value: jogadores.filter(j => j !== '.').map(j => `**${j}**`).join(', ') || 'Nenhum', inline: false }
        );

      await message.channel.send({ embeds: [embedPublico] });

    } catch (err) {
      console.error('Erro ao cadastrar equipe:', err);
      message.channel.send('❌ Ocorreu um erro ao cadastrar a equipe.');
    }
  }
};
