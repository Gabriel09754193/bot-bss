module.exports = {
  nome: 'inscricao',
  descricao: 'Cadastrar seu time (apenas no canal de inscrição)',

  async execute(message, args) {
    const canalInscricaoID = 'COLOQUE_AQUI_O_ID_DO_CANAL_DE_INSCRICAO'; // Canal público
    const canalADMID = 'COLOQUE_AQUI_O_ID_DO_CANAL_DE_ADM'; // Canal privado de admins
    const canalSuporteID = 'COLOQUE_AQUI_O_ID_DO_CANAL_DE_SUPORTE'; // Canal de suporte

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

      // Array para armazenar jogadores
      const jogadores = [];

      for (let i = 1; i <= 8; i++) {
        // Aviso depois do 5º jogador
        if (i === 6) {
          await channel.send('⚠️ Caso sua equipe não tenha 6º, 7º ou 8º player, apenas digite `.` nas próximas perguntas. Obrigado! – Administração BSS');
        }

        // Perguntar nick
        const perguntaNick = await channel.send(`🕹 **Digite o nick do jogador ${i}:**`);
        const nickMsg = (await channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
        if (!nickMsg) break; // Se o tempo esgotar, interrompe
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

      // Mensagem pública no canal de inscrição
      await channel.send({
        content: `🎉 **Equipe ${nomeTimeMsg.content} registrada na Liga BSS!** 🎉\n\n💡 Qualquer dúvida, entre em contato com o suporte <#${canalSuporteID}>`
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
