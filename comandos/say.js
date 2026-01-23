const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  nome: "say",
  async execute(message, args) {

    // Apenas administradores podem usar
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const filter = m => m.author.id === message.author.id;
    const respostas = {};

    const perguntas = [
      { pergunta: "📌 Mencione o canal onde deseja enviar a mensagem:", chave: "canal" },
      { pergunta: "📝 Qual é o conteúdo da mensagem que deseja enviar?", chave: "mensagem" },
      { pergunta: "🖼️ Quer adicionar uma imagem? Coloque o link ou digite `não`:", chave: "imagem" },
      { pergunta: "📌 Quer fixar a mensagem? Responda `sim` ou `não`:", chave: "fixar" },
      { pergunta: "📢 Quer mencionar todos (@everyone)? Responda `sim` ou `não`:", chave: "everyone" }
    ];

    let index = 0;

    const askNext = async () => {
      if (index >= perguntas.length) return sendEmbed();

      await message.channel.send(perguntas[index].pergunta);

      const collector = message.channel.createMessageCollector({ filter, max: 1, time: 600000 });

      collector.on("collect", m => {
        respostas[perguntas[index].chave] = m.content.trim();
        index++;
        askNext();
      });

      collector.on("end", collected => {
        if (collected.size === 0) {
          message.channel.send("⏰ Tempo esgotado. Comando cancelado.");
        }
      });
    };

    const sendEmbed = async () => {
      // Validar canal
      const canalMatch = respostas.canal.match(/<#[0-9]+>/);
      if (!canalMatch) return message.reply("❌ Canal inválido. Use a menção do canal.");
      const canalId = canalMatch[0].replace(/\D/g, "");
      const canal = message.guild.channels.cache.get(canalId);
      if (!canal || canal.type !== 0) return message.reply("❌ Não consegui encontrar o canal ou não é um canal de texto.");

      // Validar imagem
      let imageURL = null;
      if (respostas.imagem.toLowerCase() !== "não") {
        if (respostas.imagem.startsWith("http://") || respostas.imagem.startsWith("https://")) {
          imageURL = respostas.imagem;
        } else {
          message.channel.send("⚠️ Link de imagem inválido, a mensagem será enviada sem imagem.");
        }
      }

      // Validar sim/não
      const fixar = respostas.fixar.toLowerCase() === "sim";
      const everyone = respostas.everyone.toLowerCase() === "sim";

      // Criar embed
      const embed = new EmbedBuilder()
        .setTitle("📢 Aviso - Base Strike Series (BSS)")
        .setDescription(respostas.mensagem)
        .setColor("#1E90FF")
        .setTimestamp()
        .setFooter({ text: "Base Strike Series (BSS)" });

      if (imageURL) embed.setImage(imageURL);

      // Enviar mensagem
      const msg = await canal.send({ content: everyone ? "@everyone" : null, embeds: [embed] });

      // Fixar se necessário
      if (fixar) {
        await msg.pin().catch(() => message.channel.send("⚠️ Não foi possível fixar a mensagem."));
      }

      message.channel.send("✅ Mensagem enviada com sucesso!");
    };

    askNext();
  },
};
