const { EmbedBuilder } = require("discord.js");

const CONFIG = {
  canalPickBan: "1464661979133247518",
  canalPublico: "1464649761213780149",
  canalAdmin: "1464661705417167064",
  cargoIGL: "1463258074310508765",
  tempoResposta: 120000
};

const MAP_POOL = [
  "Ancient",
  "Anubis",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass"
];

module.exports = {
  nome: "pickban",
  async execute(message, args) {

    if (message.channel.id !== CONFIG.canalPickBan) return;
    if (!message.member.roles.cache.has(CONFIG.cargoIGL)) {
      return message.reply("❌ Apenas IGLs podem iniciar o Pick/Ban.");
    }

    const timeA = args[0];
    const timeB = args[1];
    if (!timeA || !timeB) {
      return message.reply("Uso correto: `.pickban TimeA TimeB`");
    }

    const iglA = message.author;
    const iglB = message.mentions.users.first();
    if (!iglB) return message.reply("❌ Mencione o IGL adversário.");

    let mapasDisponiveis = [...MAP_POOL];
    let bans = [];
    let picks = [];

    const canalPublico = await message.guild.channels.fetch(CONFIG.canalPublico);
    const canalAdmin = await message.guild.channels.fetch(CONFIG.canalAdmin);

    const embedPublico = new EmbedBuilder()
      .setTitle("🗺️ VETO OFICIAL — BSS")
      .setDescription(`**${timeA} vs ${timeB}**`)
      .setColor(0xff0000)
      .addFields({ name: "Status", value: "Iniciando Pick/Ban..." });

    const msgPublica = await canalPublico.send({ embeds: [embedPublico] });

    await canalAdmin.send(
      `📋 **LOG PICK/BAN BSS**\nConfronto: ${timeA} vs ${timeB}\nIGLs: ${iglA.tag} | ${iglB.tag}`
    );

    async function perguntar(usuario, texto) {
      await message.channel.send(`${usuario}, ${texto}`);
      const filtro = m => m.author.id === usuario.id;
      const coletor = await message.channel.awaitMessages({
        filter: filtro,
        max: 1,
        time: CONFIG.tempoResposta
      });

      if (!coletor.size) {
        await canalAdmin.send(`⏱️ **TEMPO ESGOTADO:** ${usuario.tag}`);
        return null;
      }
      return coletor.first().content;
    }

    // BAN 1
    let ban1 = await perguntar(iglA, `ban um mapa:\n${mapasDisponiveis.join(", ")}`);
    mapasDisponiveis = mapasDisponiveis.filter(m => m !== ban1);
    bans.push(`${timeA} baniu ${ban1}`);

    // BAN 2
    let ban2 = await perguntar(iglB, `ban um mapa:\n${mapasDisponiveis.join(", ")}`);
    mapasDisponiveis = mapasDisponiveis.filter(m => m !== ban2);
    bans.push(`${timeB} baniu ${ban2}`);

    // PICK 1
    let pick1 = await perguntar(iglA, `pick um mapa:\n${mapasDisponiveis.join(", ")}`);
    mapasDisponiveis = mapasDisponiveis.filter(m => m !== pick1);
    let side1 = await perguntar(iglB, `qual lado você escolhe no mapa ${pick1}? (CT/TR)`);
    picks.push(`${timeA} pickou ${pick1} (começa ${side1})`);

    // PICK 2
    let pick2 = await perguntar(iglB, `pick um mapa:\n${mapasDisponiveis.join(", ")}`);
    mapasDisponiveis = mapasDisponiveis.filter(m => m !== pick2);
    let side2 = await perguntar(iglA, `qual lado você escolhe no mapa ${pick2}? (CT/TR)`);
    picks.push(`${timeB} pickou ${pick2} (começa ${side2})`);

    // BANS FINAIS
    let ban3 = await perguntar(iglA, `ban um mapa:\n${mapasDisponiveis.join(", ")}`);
    mapasDisponiveis = mapasDisponiveis.filter(m => m !== ban3);
    let ban4 = await perguntar(iglB, `ban um mapa:\n${mapasDisponiveis.join(", ")}`);
    mapasDisponiveis = mapasDisponiveis.filter(m => m !== ban4);

    const decisivo = mapasDisponiveis[0];
    const ladoSorteado = Math.random() > 0.5 ? "CT" : "TR";

    embedPublico.setFields(
      { name: "Bans", value: bans.join("\n") },
      { name: "Picks", value: picks.join("\n") },
      { name: "Mapa Decisivo", value: `${decisivo}\nLados sorteados: ${ladoSorteado}` }
    );

    await msgPublica.edit({ embeds: [embedPublico] });

    await canalAdmin.send(
      `✅ Pick/Ban finalizado.\nMapa decisivo: ${decisivo}\nLado sorteado: ${ladoSorteado}`
    );

    message.channel.send("✅ Pick/Ban finalizado com sucesso.");
  }
};
