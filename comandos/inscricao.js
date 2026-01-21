module.exports = {
  nome: 'inscricao',
  descricao: 'Cadastrar seu time (apenas no canal de inscrição)',

  async execute(message, args) {
    const canalInscricaoID = '1463260686011338814'; // Canal público
    const canalADMID = '1463542650568179766'; // Canal privado de admins
    const nomeOrg = 'Liga BSS'; // Nome da organização
    const canalSuporteID = '1463261657798283351'; // Canal de suporte

    if (message.channel.id !== canalInscricaoID) {
      return message.reply('❌ Use este comando apenas no canal de inscrição.');
    }

    const channel = message.channel;
    const filter = m => m.author.id === message.author.id;

    // Deletar a mensagem inicial do comando para não poluir
    try {
      await message.delete();
    } catch (err) {
      console.warn('Não foi possível deletar a mensagem do comando.');
    }

    try {
      // Pergunta 1: Nome do time
      const perguntaNome = await channel.send('🎯 **Digite o nome do seu time:**');
      const nomeTimeMsg = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return channel.send('❌ Tempo esgotado.');
      await nomeTimeMsg.delete();
      await perguntaNome.delete();

      // Array para armazenar jogadores
      const jogadores = [];

      for (let i = 1; i <= 8; i++) {
        if (i === 6) {
          await channel.send('⚠️ Caso sua equipe não tenha 6º, 7º ou 8º player, apenas digite `.` nas próximas perguntas. Obrigado! – Administração BSS');
        }

        // Perguntar nick
        const perguntaNick = await channel.send(`🕹 **Digite o nick do jogador ${i}:**`);
        const nickMsg = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!nickMsg) break;
        await nickMsg.delete();
        await perguntaNick.delete();

        // Perguntar função
        const perguntaFunc = await channel.send(`🎯 **Digite a função do jogador ${i}:**`);
        const funcMsg = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!funcMsg) break;
        await funcMsg.delete();
        await perguntaFunc.delete();

        // Perguntar Steam
        const perguntaSteam = await channel.send(`💻 **Digite o link Steam do jogador ${i}:**`);
        const steamMsg = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!steamMsg) break;
        await steamMsg.delete();
        await perguntaSteam.delete();

        jogadores.push({
          nick: nickMsg.content,
          funcao: funcMsg.content,
          steam: steamMsg.content
        });
      }

      // Mensagem pública no canal de inscrição (limpa e bonita)
      await channel.send({
        content: `🎉 **O IGL <@${message.author.id}> fez a inscrição da Equipe **${nomeTimeMsg.content}** na organização ${nomeOrg}!** 🎉\n\n💡 A organização agradece toda a equipe por se inscrever e acreditar no nosso trabalho 😉\nQualquer dúvida, entre em contato com suporte <#${canalSuporteID}>`
      });

      // Mensagem privada no canal ADM
      const canalADM = await message.guild.channels.fetch(canalADMID);
      let jogadoresTexto = jogadores.map((j, idx) => {
        if (j.nick === '.') return `- Jogador ${idx + 1}: (vaga não preenchida)`;
        return `- **${j.nick}** - ${j.funcao} - ${j.steam}`;
      }).join('\n');

      await canalADM.send({
        content: `**Nova inscrição de equipe**\n\n**Time:** ${nomeTimeMsg.content}\n**IGL:** <@${message.author.id}>\n**Jogadores:**\n${jogadoresTexto}`
      });

    } catch (err) {
      console.error(err);
      message.reply('❌ Ocorreu um erro ao processar a inscrição.');
    }
  }
};
