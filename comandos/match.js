const { MessageEmbed, MessageActionRow, MessageButton, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "match",
  descricao: "Criar partida com chat privado, Pick/Ban completo e amistoso BSS",
  async execute(message, args, client) {
    if (!message.member.roles.cache.some(r => r.name.toLowerCase().includes("igl"))) {
      return message.reply("❌ Apenas IGLs podem executar este comando!");
    }

    const ID_CATEGORIA_MATCH = "1463562210591637605";
    const ID_PARTIDAS_ESPERA = "1463270089376927845";
    const ID_PICKBAN = "1464649761213780149";
    const ID_AMISTOSOS = "1466989903232499712";
    const ID_RESULTADOS = "1463260797604987014";

    const filter = m => m.author.id === message.author.id;

    try {
      // 1️⃣ Pergunta Time A
      await message.reply("📝 Qual o **nome do seu time (Time A)**?");
      const collectedTimeA = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] });
      const nomeTimeA = collectedTimeA.first().content;

      // 2️⃣ Pergunta Time B
      await message.reply("📝 Qual o **nome do time adversário (Time B)**?");
      const collectedTimeB = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] });
      const nomeTimeB = collectedTimeB.first().content;

      // 3️⃣ Pergunta formato
      await message.reply("🎮 Qual o **formato da partida**? (MD1/MD3)");
      const collectedFormato = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] });
      const formato = collectedFormato.first().content.toUpperCase();

      // Criação do chat privado
      const guild = message.guild;
      const canalPrivado = await guild.channels.create(`match-${nomeTimeA}-vs-${nomeTimeB}`, {
        type: 0,
        parent: ID_CATEGORIA_MATCH || null,
        permissionOverwrites: [
          { id: message.author.id, allow: ["ViewChannel", "SendMessages"] },
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
        ],
      });

      // Embed do chat privado
      const embedPrivado = new MessageEmbed()
        .setTitle("📢 BSS | Chat Privado de Partida")
        .setDescription(`Bem-vindos ao chat privado da partida!\n\n👑 **IGL Time A:** ${message.author}\n🎯 **Time A:** ${nomeTimeA}\n⚔️ **Time B:** ${nomeTimeB}\n🗓️ **Formato:** ${formato}\n\n📌 **Objetivo:**\n• Combinarem horários\n• Treinar e organizar a partida\n• Executar Pick/Ban quando ADM autorizar\n• O chat ficará disponível por dias para organização`)
        .setColor("ORANGE")
        .setFooter({ text: "Base Strikes Series • Sistema de Matches" })
        .setTimestamp();

      const rowButtons = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("iniciar_pickban")
          .setLabel("🎲 Iniciar Pick/Ban (ADM)")
          .setStyle("PRIMARY"),
        new MessageButton()
          .setCustomId("inserir_resultado")
          .setLabel("🏁 Inserir Resultado (ADM)")
          .setStyle("SUCCESS"),
        new MessageButton()
          .setCustomId("cancelar_partida")
          .setLabel("❌ Cancelar Partida (ADM)")
          .setStyle("DANGER")
      );

      await canalPrivado.send({ embeds: [embedPrivado], components: [rowButtons] });

      // Embed público na partida em espera
      const embedPublico = new MessageEmbed()
        .setDescription(`🔥 **Solicitação de partida criada!**\n👑 **IGL Time A:** ${message.author}\n🎯 **Time A:** ${nomeTimeA}\n⚔️ **Time B:** ${nomeTimeB}\n🗓️ **Formato:** ${formato}\n⏳ Aguardando organização e confirmação da partida.`)
        .setColor("BLUE")
        .setFooter({ text: "Base Strikes Series • Sistema de Matches" })
        .setTimestamp();

      const canalEspera = guild.channels.cache.get(ID_PARTIDAS_ESPERA);
      if (canalEspera) canalEspera.send({ embeds: [embedPublico] });

      // Coletor de botões no chat privado
      const collector = canalPrivado.createMessageComponentCollector({ componentType: "BUTTON", time: 0 });

      let pickbanAtivo = false;
      let turnoIGL = null;
      let mapasDisponiveis = ["Mirage","Dust2","Inferno","Anubis","Overpass"];
      let mapasBanidos = [];
      let mapasPickados = [];
      let sides = {};

      collector.on("collect", async i => {
        if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return i.reply({ content: "❌ Apenas ADM pode usar esses botões!", ephemeral: true });
        }

        // CANCELAR PARTIDA
        if (i.customId === "cancelar_partida") {
          await canalPrivado.delete().catch(console.error);
          return i.reply({ content: "❌ Partida cancelada pelo ADM!", ephemeral: true });
        }

        // INICIAR PICK/BAN
        if (i.customId === "iniciar_pickban") {
          pickbanAtivo = true;
          turnoIGL = message.author.id; // ADM define turno inicial, guia IGLs

          const embedPickBan = new MessageEmbed()
            .setTitle("🎲 Pick/Ban | BSS")
            .setDescription(`O ADM iniciou o **Pick/Ban** da partida!\n\n👑 **IGL Time A:** ${message.author}\n🎯 **Time A:** ${nomeTimeA}\n⚔️ **Time B:** ${nomeTimeB}\n🗓️ **Formato:** ${formato}\n\n📌 Mapas disponíveis: ${mapasDisponiveis.join(", ")}\n\n⚠️ Apenas o IGL no turno poderá executar os bans/picks.\nUse os comandos:\n• .ban [mapa]\n• .pick [mapa]\n• .side [CT/TR] para mapa decisivo.`)
            .setColor("GREEN")
            .setFooter({ text: "Base Strikes Series • Pick/Ban" })
            .setTimestamp();

          return i.reply({ embeds: [embedPickBan] });
        }

        // INSERIR RESULTADO (só para ADM)
        if (i.customId === "inserir_resultado") {
          const embedResultado = new MessageEmbed()
            .setTitle("🏁 Inserir Resultado | BSS")
            .setDescription(`O ADM poderá registrar o resultado da partida no canal <#${ID_RESULTADOS}>`)
            .setColor("YELLOW")
            .setFooter({ text: "Base Strikes Series • Sistema de Matches" })
            .setTimestamp();

          return i.reply({ embeds: [embedResultado], ephemeral: true });
        }
      });

      // Função para enviar amistoso
      const enviarAmistoso = async () => {
        const embedAmistoso = new MessageEmbed()
          .setTitle("⚔️ Amistoso BSS")
          .setDescription(`**Time A:** ${nomeTimeA}\n**Time B:** ${nomeTimeB}\n**Formato:** ${formato}\n**Mapas selecionados:** ${mapasPickados.join(", ")}\n\n🗓️ Combinar horário e jogar a partida!`)
          .setColor("PURPLE")
          .setFooter({ text: "Base Strikes Series • Amistoso" })
          .setTimestamp();

        const canalAmistoso = guild.channels.cache.get(ID_AMISTOSOS);
        if (canalAmistoso) canalAmistoso.send({ embeds: [embedAmistoso] });
      };

    } catch (err) {
      console.error(err);
      message.reply("❌ Tempo esgotado ou erro ao coletar informações. Tente novamente!");
    }
  },
};
