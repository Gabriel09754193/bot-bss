const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

/* =========================
   CONFIGURAÇÕES FIXAS (BSS)
========================= */
const IDS = {
  PARTIDAS_EM_ESPERA: "1463270089376927845",
  PICKBAN: "1464649761213780149",
  RESULTADOS: "1463260797604987014",
  AMISTOSOS: "1466989903232499712",
  CATEGORIA_MATCH: "1463562210591637605",
};

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2"];
const activePickBans = new Map();

module.exports = {
  nome: "match",

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    // Limpeza automática do comando
    setTimeout(() => message.delete().catch(() => {}), 1000);

    const perguntas = ["🛡️ **Qual o nome da sua equipe?**", "📅 **Disponibilidade da equipe?**"];
    let respostas = [];
    let msgsColeta = [];

    const instrucao = await message.channel.send("⚔️ **BSS | Configurando Amistoso...**");
    msgsColeta.push(instrucao);

    const coletor = message.channel.createMessageCollector({ 
      filter: (m) => m.author.id === message.author.id, 
      max: 2, time: 60000 
    });

    const q1 = await message.channel.send(perguntas[0]);
    msgsColeta.push(q1);

    coletor.on("collect", async (m) => {
      respostas.push(m.content);
      msgsColeta.push(m);
      if (respostas.length < 2) {
        const q2 = await message.channel.send(perguntas[1]);
        msgsColeta.push(q2);
      }
    });

    coletor.on("end", async () => {
      // Limpa o chat #matchs
      msgsColeta.forEach(msg => msg.delete().catch(() => {}));

      if (respostas.length < 2) return;

      const [nomeA, disp] = respostas;
      const canalEspera = await client.channels.fetch(IDS.PARTIDAS_EM_ESPERA);

      const embed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🔥 BSS | Amistoso Disponível")
        .addFields(
          { name: "🛡️ Time", value: `**${nomeA}**`, inline: true },
          { name: "🎮 IGL", value: `<@${message.author.id}>`, inline: true },
          { name: "📅 Disponibilidade", value: `\`${disp}\`` }
        )
        .setFooter({ text: `ID:${message.author.id} | Status: Pendente` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bss_match_aceitar").setLabel("Aceitar Match").setStyle(ButtonStyle.Success)
      );

      await canalEspera.send({ embeds: [embed], components: [row] });
    });
  },
};

/* =========================
   SISTEMA DE INTERAÇÕES
========================= */
module.exports.setupPickBan = (client) => {
  client.on("interactionCreate", async (interaction) => {
    
    if (interaction.isButton()) {
      const state = activePickBans.get(interaction.channel.id);

      // --- ACEITAR MATCH ---
      if (interaction.customId === "bss_match_aceitar") {
        const embedOriginal = interaction.message.embeds[0];
        const iglAId = embedOriginal.footer.text.split("ID:")[1].split(" |")[0];
        const nomeA = embedOriginal.fields[0].value.replace(/\*/g, "");

        if (interaction.user.id === iglAId) return interaction.reply({ content: "❌ Você não pode aceitar seu próprio jogo.", ephemeral: true });

        // Atualiza chat de espera
        const embedAceito = EmbedBuilder.from(embedOriginal)
          .setColor("#555555")
          .setTitle("✅ BSS | Amistoso em Andamento")
          .addFields({ name: "⚔️ Adversário", value: `<@${interaction.user.id}>` })
          .setFooter({ text: `Partida sendo combinada no privado.` });

        await interaction.update({ embeds: [embedAceito], components: [] });

        // Criar canal privado
        const canal = await interaction.guild.channels.create({
          name: `match-${nomeA}`,
          parent: IDS.CATEGORIA_MATCH,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: iglAId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          ],
        });

        const askTimeB = await canal.send(`🛡️ <@${interaction.user.id}>, **qual o nome da sua equipe?**`);
        const col = canal.createMessageCollector({ filter: (m) => m.author.id === interaction.user.id, max: 1 });
        
        col.on("collect", async (m) => {
          const nomeB = m.content;
          m.delete().catch(() => {});
          askTimeB.delete().catch(() => {});

          const embedBoasVindas = new EmbedBuilder()
            .setColor("#1E90FF")
            .setTitle("🤝 BSS | Amistoso Confirmado")
            .setDescription("Este chat é destinado para a **marcação de horário** e alinhamento com a staff.\n\n⚠️ **Os botões abaixo são de uso exclusivo da ADMINISTRAÇÃO.**")
            .addFields(
              { name: "🛡️ Time A", value: nomeA, inline: true }, { name: "🛡️ Time B", value: nomeB, inline: true },
              { name: "🎮 IGL A", value: `<@${iglAId}>`, inline: true }, { name: "🎮 IGL B", value: `<@${interaction.user.id}>`, inline: true }
            );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("pb_start").setLabel("[Admin] Iniciar Pick/Ban").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("match_result").setLabel("[Admin] Resultado").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("match_cancel").setLabel("[Admin] Cancelar").setStyle(ButtonStyle.Danger)
          );
          await canal.send({ embeds: [embedBoasVindas], components: [row] });
        });
      }

      // --- INICIAR PICK/BAN (ADMIN) ---
      if (interaction.customId === "pb_start") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ Apenas Administradores podem acionar o Pick/Ban.", ephemeral: true });
        }
        
        const embedOriginal = interaction.message.embeds[0];
        const stateData = {
          iglA: embedOriginal.fields[2].value.match(/\d+/)[0],
          iglB: embedOriginal.fields[3].value.match(/\d+/)[0],
          timeA: embedOriginal.fields[0].value,
          timeB: embedOriginal.fields[1].value,
          bans: [], picks: [], pool: [...MAP_POOL], logs: [], statusLado: false
        };
        stateData.turno = Math.random() < 0.5 ? stateData.iglA : stateData.iglB;
        activePickBans.set(interaction.channel.id, stateData);
        
        // Mantém os botões de Resultado/Cancelar, mas remove o de Iniciar Pick/Ban
        const rowAtualizada = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("match_result").setLabel("[Admin] Resultado").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("match_cancel").setLabel("[Admin] Cancelar").setStyle(ButtonStyle.Danger)
        );
        
        await interaction.update({ components: [rowAtualizada] });
        refreshPB(interaction.channel, stateData);
      }

      // ... Restante da lógica de Lados, Veto e Modal Resultado ...
    }
  });
};
