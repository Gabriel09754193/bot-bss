const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  nome: "equipe",
  execute: async (message, args, client) => {
    // 1. Verificação de Admin
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    // 2. IDs de Canais e Tags
    const logoBSS = "https://cdn.discordapp.com/icons/1463256488205090920/36cc89f00f2baf2004186f6cd15e68c2.png?size=2048";
    const canais = {
      liberada: "1471171334380982495",
      afastada: "1471170999109157016",
      banida: "1471171178868506777"
    };
    const tags = {
      liberada: "1471161180524380293",
      afastada: "1471160904598163466",
      banida: "1471169188650553679"
    };

    // 3. Captura de Argumentos
    const alvoRole = message.mentions.roles.first();
    const acao = args[1]?.toLowerCase();
    const motivo = args.slice(2).join(" ") || "Critério da diretoria técnica BSS.";

    // 4. Validação Inicial
    if (!alvoRole || !['liberada', 'afastada', 'banida'].includes(acao)) {
      return message.reply("⚠️ **Uso:** `.equipe @CargoDoTime [liberada/afastada/banida] [motivo]`");
    }

    try {
      // 5. Busca membros (Essencial para não dar erro de cache)
      await message.guild.members.fetch();
      const membrosComCargo = alvoRole.members;

      if (membrosComCargo.size === 0) {
        return message.reply(`⚠️ O cargo **${alvoRole.name}** não tem membros.`);
      }

      // 6. Feedback visual no chat de comando
      const statusMsg = await message.reply(`⏳ Sincronizando **${membrosComCargo.size}** membros...`);

      // 7. Processamento das Tags
      const tagAdicionar = tags[acao];
      const tagsRemover = Object.values(tags).filter(t => t !== tagAdicionar);

      for (const [id, membro] of membrosComCargo) {
        await membro.roles.add(tagAdicionar).catch(() => {});
        await membro.roles.remove(tagsRemover).catch(() => {});
      }

      // 8. Envio do Embed para o canal correto
      const cores = { liberada: "#2ECC71", afastada: "#E67E22", banida: "#FF0000" };
      const titulos = { liberada: "✅ EQUIPE LIBERADA", afastada: "⚠️ EQUIPE AFASTADA", banida: "🚫 EQUIPE BANIDA" };

      const embed = new EmbedBuilder()
        .setAuthor({ name: "🛡️ BSS LIGA OFICIAL", iconURL: logoBSS })
        .setTitle(titulos[acao])
        .setColor(cores[acao])
        .setThumbnail(logoBSS)
        .setDescription(`A organização **${alvoRole.name}** teve seu status atualizado.\n\n**Justificativa:**\n\`\`\`text\n${motivo}\n\`\`\``)
        .setFooter({ text: `Total de ${membrosComCargo.size} membros sincronizados.` })
        .setTimestamp();

      const canalDestino = client.channels.cache.get(canais[acao]);
      if (canalDestino) await canalDestino.send({ embeds: [embed] });

      await statusMsg.edit(`✅ **Sucesso!** Equipe **${alvoRole.name}** marcada como **${acao}**.`);

    } catch (error) {
      console.error(error);
      message.reply("❌ Erro ao processar. Verifique se o bot tem permissão de 'Gerenciar Cargos'.");
    }
  }
};