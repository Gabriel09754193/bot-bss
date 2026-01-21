module.exports = {
  nome: 'inscricao',
  descricao: 'Cadastrar seu time (apenas no canal de inscrição)',

  async execute(message, args) {
    const canalInscricaoID = '1463260686011338814'; // Canal público de inscrição
    const canalADMID = '1463542650568179766'; // Canal privado de ADM
    const canalSuporteID = '1463261657798283351'; // ID do canal de suporte

    // Checar se está no canal correto
    if (message.channel.id !== canalInscricaoID) {
      return message.reply('❌ Use este comando apenas no canal de inscrição.');
    }

    const channel = message.channel;
    const filter = m => m.author.id === message.author.id;

    try {
      // Pergunta 1: Nome do time
      const perguntaNome = await channel.send('🎯 **Digite o nome do seu time:**');
      const nomeTimeMsg = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return channel.send('❌ Tempo esgotado.');

      await nomeTimeMsg.delete();
      await perguntaNome.delete();

      // Pergunta 2: Jogadores e funções
      const perguntaJogadores = await channel.send('📝 **Digite os jogadores e suas funções (uma linha por jogador):**');
      const jogadoresMsg = (await channel.awaitMessages({ filter, max: 1, time: 120000 })).first();
      if (!jogadoresMsg) return channel.send('❌ Tempo esgotado.');

      await jogadoresMsg.delete();
      await perguntaJogadores.delete();

      // Mensagem pública no canal de inscrição
      await channel.send({
        content: `🎉 **Equipe ${nomeTimeMsg.content} registrada na Liga BSS!** 🎉\n\n💡 Qualquer dúvida, entre em contato com o suporte <#${canalSuporteID}>`
      });

      // Mensagem privada no canal de ADM
      const canalADM = await message.guild.channels.fetch(canalADMID);
      await canalADM.send({
        content: `**Nova inscrição de equipe**\n\n**Time:** ${nomeTimeMsg.content}\n**IGL:** <@${message.author.id}>\n**Jogadores:**\n${jogadoresMsg.content}`
      });

    } catch (err) {
      console.error(err);
      message.reply('❌ Ocorreu um erro ao processar a inscrição.');
    }
  }
};
