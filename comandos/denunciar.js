const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "denunciar",
  execute: async (message, args, client) => {
    // Apaga a mensagem para manter o sigilo
    await message.delete().catch(() => {});

    // Cria o Formulário (Modal)
    const modal = new ModalBuilder()
      .setCustomId('modal_denuncia')
      .setTitle('🛡️ Formulário de Denúncia BSS');

    const campoAlvo = new TextInputBuilder()
      .setCustomId('denuncia_alvo')
      .setLabel("Qual o nome do Jogador ou Time?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const campoMotivo = new TextInputBuilder()
      .setCustomId('denuncia_motivo')
      .setLabel("O que aconteceu?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const campoProvas = new TextInputBuilder()
      .setCustomId('denuncia_provas')
      .setLabel("Cole links de vídeos ou prints aqui:")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(campoAlvo),
      new ActionRowBuilder().addComponents(campoMotivo),
      new ActionRowBuilder().addComponents(campoProvas)
    );

    // Mostra o formulário para o usuário
    await message.channel.send({ 
      content: `🔒 **${message.author.username}**, clique no botão abaixo para preencher sua denúncia de forma segura.`,
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('btn_abrir').setLabel('Abrir Formulário').setStyle(TextInputStyle.Short) // Nota: Modais precisam ser acionados por interações de botão ou comandos slash.
        )
      ]
    }).then(msg => setTimeout(() => msg.delete(), 10000)); // Apaga o aviso após 10 segundos
  }
};
