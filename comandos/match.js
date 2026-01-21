module.exports = {
  name: 'match',

  execute(message) {
    message.reply(
      '🎮 **MATCH ABERTO!**\n' +
      'Seu time está disponível para jogar.\n' +
      'Aguardando adversário.'
    );
  }
};
