const { PermissionsBitField } = require('discord.js');

module.exports = {
  nome: 'inscricao',
  descricao: 'Cadastrar seu time (apenas no canal de inscrição)',

  async execute(message, args) {
    const canalInscricaoID = '1463260686011338814';
    const canalADMID = '1463542650568179766';
    const canalSuporte = '#suporte'; // Coloque o nome do canal que quer que apareça na mensagem final

    // Checar se é o canal certo
    if (message.channel.id !== canalInscricaoID) {
      return message.reply(`❌ Use este comando apenas no canal de inscrição.`);
    }

    const channel = message.channel;
    const filter = m => m.author.id === message.author.id;

    try {
      // Pergunta 1: Nome do time
      const perguntaNome = await channel.send('Digite o nome do seu time:');
      const nomeTimeMsg = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
      if (!nomeTimeMsg) return channel.send('❌ Tempo esgotado.');

      await nomeTimeMsg.delete();
      await perguntaNome.delete();

      // Pergunta 2: Jogadores e funções
      const perguntaJogadores = await channel.send('Digite os jogadores e suas funções (uma linha por jogador):');
      const jogadoresMsg = (await channel.awaitMessages({ filter, max: 1, time: 120000 })).first();
      if (!jogadoresMsg) return channel.send('❌ Tempo esgotado.');

      await jogadoresMsg.delete();
      await perguntaJogadores.delete();

      // Enviar tudo para canal ADM
      const canalADM = await message.guild.channels.fetch(canalADMID);
      await canalADM.send({
        content: `✅ **Equipe ${nomeTimeMsg.content} registrada na Liga BSS**\n\n**IGL:** <@${message.author.id}>\n**Jogadores:**\n${jogadoresMsg.content}\n\nQualquer dúvida entrar em contato com suporte ${canalSuporte}`
      });

      // Confirmar para o IGL
      await message.reply({ content: `✅ Sua inscrição foi enviada com sucesso!`, ephemeral: true });

    } catch (err) {
      console.error(err);
      message.reply('❌ Ocorreu um erro ao processar a inscrição.');
    }
  }
};
