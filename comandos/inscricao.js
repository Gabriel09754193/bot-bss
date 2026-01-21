const { EmbedBuilder } = require('discord.js');

module.exports = {
  nome: 'inscricao',
  descricao: 'Cadastrar um time na liga BSS',

  async execute(message, args, client) {
    try {
      const timesCommand = client.commands.get('times');
      if (!timesCommand) return message.channel.send('❌ Comando .times não encontrado.');

      const filter = m => m.author.id === message.author.id;
      const MAX_JOGADORES = 8;

      // --------------------------
      // CONFIGURE AQUI OS IDS
      // --------------------------
      const CANAL_INSCRICAO_ID = '1463260686011338814'; // Canal de inscrição público
      const CANAL_ADMINS_ID = '1463542650568179766';       // Canal privado de admins
      const CANAL_SUPORTE_ID = '1463261657798283351';     // Canal de suporte público

      // Apenas no canal de inscrição
      if (message.channel.id !== CANAL_INSCRICAO_ID) {
        return message.reply('❌ Este comando só pode ser usado no canal de inscrição.');
      }

      // --------------------------
      // Nome do time
      // --------------------------
      const msgTime = await message.channel.send('🎯 **Digite o nome do seu time:**');
      const nomeTimeMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return message.channel.send('❌ Tempo esgotado.');
      const nomeTime = nomeTimeMsg.content;
      await nomeTimeMsg.delete();
      await msgTime.delete();

      const jogadores = [];

      // --------------------------
      // Cadastro dos jogadores
      // --------------------------
      for (let i = 1; i <= MAX_JOGADORES; i++) {
        if (i === 6) {
          await message.channel.send(
            '⚠️ Caso não tenha 6º, 7º ou 8º jogador, digite `.` nas próximas perguntas. Obrigado! - Administração BSS'
          );
        }

        const msgNick = await message.channel.send(`👤 **Player ${i} - Digite o nick:**`);
        const nickMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!nickMsg) return message.channel.send('❌ Tempo esgotado.');
        const nick = nickMsg.content;
        await nickMsg.delete();
        await msgNick.delete();

        const msgFuncao = await message.channel.send(`🎮 **Player ${i} - Digite a função:**`);
        const funcaoMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!funcaoMsg) return message.channel.send('❌ Tempo esgotado.');
        const funcao = funcaoMsg.content;
        await funcaoMsg.delete();
        await msgFuncao.delete();

        const msgSteam = await message.channel.send(`💻 **Player ${i} - Digite o perfil Steam:**`);
        const steamMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!steamMsg) return message.channel.send('❌ Tempo esgotado.');
        const steam = steamMsg.content;
        await steamMsg.delete();
        await msgSteam.delete();

        jogadores.push({ nick, funcao, steam });
      }

      // --------------------------
      // Salvar no comando times
      // --------------------------
      timesCommand.timesPendentes.set(message.author.id, {
        criador: message.author.id,
        nomeTime,
        jogadores
      });

      // --------------------------
      // Mensagem para admins
      // --------------------------
      const canalAdmins = await message.guild.channels.fetch(CANAL_ADMINS_ID);
      const embedAdmins = new EmbedBuilder()
        .setTitle(`📋 Nova Inscrição de Equipe`)
        .setColor('Blue')
        .addFields(
          { name: 'Time', value: nomeTime, inline: true },
          { name: 'IGL', value: `<@${message.author.id}>`, inline: true },
          { 
            name: 'Jogadores', 
            value: jogadores
              .filter(j => j.nick !== '.')
              .map(j => `**${j.nick}** | Função: ${j.funcao} | [Steam](${j.steam})`)
              .join('\n') || 'Nenhum jogador cadastrado'
          }
        )
        .setFooter({ text: 'Administração BSS' });

      await canalAdmins.send({ embeds: [embedAdmins] });

      // --------------------------
      // Mensagem final no chat público
      // --------------------------
      const canalSuporte = await message.guild.channels.fetch(CANAL_SUPORTE_ID);
      const embedPublico = new EmbedBuilder()
        .setTitle('✅ Equipe Registrada!')
        .setColor('Green')
        .setDescription(`🎉 Equipe **${nomeTime}** registrada na **Liga BSS**!\n\n📌 Para dúvidas, entre em contato com ${canalSuporte}`)
        .addFields(
          { name: 'IGL', value: `<@${message.author.id}>`, inline: true },
          {
            name: 'Jogadores',
            value: jogadores
              .filter(j => j.nick !== '.')
              .map(j => `**${j.nick}** | Função: ${j.funcao} | [Steam](${j.steam})`)
              .join('\n') || 'Nenhum jogador cadastrado'
          }
        )
        .setFooter({ text: '🎯 Boa sorte na Liga BSS!' });

      await message.channel.send({ embeds: [embedPublico] });

    } catch (err) {
      console.error('Erro ao cadastrar equipe:', err);
      message.channel.send('❌ Ocorreu um erro ao cadastrar a equipe.');
    }
  }
};
