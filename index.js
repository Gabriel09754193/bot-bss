const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  Partials 
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

// Variáveis globais
let filaIGL = []; // [{id, username}]
let jogosAtivos = []; // [{canalId, times: [IGL1, IGL2]}]

client.once("ready", async () => {
  console.log("🤖 Bot da liga CS2 online!");

  // Comando de slash para marcar jogo
  const comando = new SlashCommandBuilder()
    .setName("marcar_jogo")
    .setDescription("IGL marca disponibilidade para jogo");

  await client.application.commands.set([comando]);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "marcar_jogo") {
      const membro = interaction.member;

      // Verifica se é IGL
      const isIGL = membro.roles.cache.some(role => role.name === "IGL");
      if (!isIGL) {
        return interaction.reply({content: "❌ Apenas IGLs podem usar este comando.", ephemeral: true});
      }

      // Adiciona na fila
      if (filaIGL.some(i => i.id === membro.id)) {
        return interaction.reply({content: "⏳ Você já está aguardando jogo.", ephemeral: true});
      }

      filaIGL.push({id: membro.id, username: membro.user.username});

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`aceitar_${membro.id}`)
            .setLabel("Aceitar e colocar meu time")
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({content: `✅ ${membro.user.username} está aguardando jogo...`, components: [row]});
    }
  }

  // Botões
  if (interaction.isButton()) {
    const [acao, iglId] = interaction.customId.split("_");

    if (acao === "aceitar") {
      const outroIGL = interaction.member;
      const esperando = filaIGL.find(i => i.id === iglId);

      if (!esperando) return interaction.reply({content: "❌ Este IGL não está mais na fila.", ephemeral: true});
      if (esperando.id === outroIGL.id) return interaction.reply({content: "❌ Você não pode jogar contra você mesmo.", ephemeral: true});

      // Pergunta o nome do time
      await interaction.reply({content: "Digite o nome do seu time no chat."});

      const filter = m => m.author.id === outroIGL.id;
      const collector = interaction.channel.createMessageCollector({filter, time: 30000, max: 1});

      collector.on("collect", async m => {
        const nomeTime2 = m.content;
        const nomeTime1 = esperando.username;

        // Cria canal privado
        const guild = interaction.guild;
        const categoria = guild.channels.cache.find(c => c.name === "Jogos" && c.type === 4); // Categoria
        const canal = await guild.channels.create({
          name: `${nomeTime1}-x-${nomeTime2}`,
          type: 0, // text channel
          parent: categoria.id,
          permissionOverwrites: [
            {id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel]},
            {id: esperando.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]},
            {id: outroIGL.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]}
          ]
        });

        jogosAtivos.push({canalId: canal.id, times: [esperando.id, outroIGL.id]});
        filaIGL = filaIGL.filter(i => i.id !== esperando.id);

        canal.send(`🎮 Canal criado para o jogo!\nTimes: ${nomeTime1} x ${nomeTime2}`);
      });

      collector.on("end", collected => {
        if (collected.size === 0) {
          interaction.followUp({content: "❌ Tempo esgotado. Nenhum nome de time foi digitado.", ephemeral: true});
        }
      });
    }
  }
});

// Comando de resultado (apenas admins)
client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith("!resultado")) return;

  if (!msg.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return msg.reply("❌ Apenas administradores podem encerrar a partida e registrar o resultado!");
  }

  const conteudo = msg.content.replace("!resultado", "").trim();
  if (!conteudo) return msg.reply("❌ Você precisa colocar o resultado!");

  // Enviar para canal de resultados
  const canalResultados = msg.guild.channels.cache.find(c => c.name === "resultados");
  if (canalResultados) canalResultados.send(`🏆 Resultado: ${conteudo}`);

  // Deleta canal da partida
  const jogo = jogosAtivos.find(j => j.canalId === msg.channel.id);
  if (jogo) {
    jogosAtivos = jogosAtivos.filter(j => j.canalId !== msg.channel.id);
    msg.channel.delete();
  }
});

client.login(process.env.TOKEN);
