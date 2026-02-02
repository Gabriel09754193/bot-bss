const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField 
} = require("discord.js");

module.exports = {
  nome: "match",
  async execute(message, args, client) {
    const ID_CARGO_IGL = "1463258074310508765";
    const ID_CANAL_ESPERA = "1463270089376927845";

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
        !message.member.roles.cache.has(ID_CARGO_IGL)) {
      return message.reply("❌ Apenas IGLs ou Administradores podem iniciar um desafio.");
    }

    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Qual a disponibilidade?**"];
    let respostas = [];
    
    const prompt = await message.channel.send("📝 **Iniciando coleta de dados...**");
    const coletor = message.channel.createMessageCollector({ 
        filter: (m) => m.author.id === message.author.id, 
        max: 2, time: 60000 
    });

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      m.delete().catch(() => {});
      if (respostas.length === 1) prompt.edit(perguntas[1]);
    });

    coletor.on("end", async () => {
      prompt.delete().catch(() => {});
      if (respostas.length < 2) return;

      const [nomeA, disp] = respostas;
      const canalEspera = await client.channels.fetch(ID_CANAL_ESPERA);

      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 NOVO DESAFIO DISPONÍVEL")
        .addFields(
          { name: "🛡️ Equipe", value: `**${nomeA}**`, inline: true },
          { name: "👑 IGL", value: `${message.author}`, inline: true },
          { name: "📅 Disponibilidade", value: `\`${disp}\`` }
        )
        .setFooter({ text: `${message.author.id}` }); // ID do criador para o aceite

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_accept_match").setLabel("ACEITAR DESAFIO").setStyle(ButtonStyle.Success).setEmoji("⚔️")
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
};
