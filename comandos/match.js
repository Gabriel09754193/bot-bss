const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    nome: 'match',
    descricao: 'Criar uma partida',
    partidasPendentes: new Map(),

    async execute(message, args) {

        // ------------------------------
        // CONFIGURE AQUI
        // ------------------------------
        const canalMatchID = '1463270016303759504'; // Apenas nesse canal os IGLs podem criar partidas
        const roleIGL = '1463258074310508765'; // Role que representa IGL
        const canalSolicitacoesID = '1463270089376927845';
        const categoriaPartidasID = '1463562210591637605';
        const canalResultadosID = '1463260797604987014';

        // ------------------------------
        // RESTRIÇÕES
        // ------------------------------
        if (!message.member.roles.cache.has(roleIGL)) 
            return message.reply('❌ Apenas IGLs podem criar partidas.');

        if (message.channel.id !== canalMatchID) 
            return message.reply(`❌ Este comando só pode ser usado no canal <#${canalMatchID}>.`);

        if (this.partidasPendentes.has(message.author.id)) 
            return message.reply('❌ Você já possui uma partida pendente.');

        try {
            const filter = m => m.author.id === message.author.id;

            // ------------------------------
            // Pergunta 1: Nome do Time
            // ------------------------------
            const msgTime = await message.channel.send('🎯 **Digite o nome do seu time:**');
            const nomeTimeMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
            if (!nomeTimeMsg) return message.channel.send('❌ Tempo esgotado.');
            await nomeTimeMsg.delete();
            await msgTime.delete();

            // ------------------------------
            // Pergunta 2: Formato MD1 / MD3
            // ------------------------------
            const msgFormato = await message.channel.send('⚔️ **Escolha o formato da partida:** `MD1` ou `MD3`');
            const formatoMsg = (await message.channel.awaitMessages({ filter, max: 1, time: 60000 })).first();
            if (!formatoMsg) return message.channel.send('❌ Tempo esgotado.');
            const formato = formatoMsg.content.toUpperCase() === 'MD3' ? 'MD3' : 'MD1';
            await formatoMsg.delete();
            await msgFormato.delete();

            // ------------------------------
            // Criar partida pendente
            // ------------------------------
            const partida = {
                id: Date.now(),
                criador: message.author.id,
                nomeTime: nomeTimeMsg.content,
                formato,
                status: 'aguardando'
            };
            this.partidasPendentes.set(message.author.id, partida);

            // ------------------------------
            // Embed de solicitação
            // ------------------------------
            const canalSolicitacoes = await message.guild.channels.fetch(canalSolicitacoesID);
            const embed = new EmbedBuilder()
                .setTitle('🎮 Partida Solicitada')
                .setColor('Blurple')
                .addFields(
                    { name: 'Time', value: partida.nomeTime, inline: true },
                    { name: 'IGL', value: `<@${message.author.id}>`, inline: true },
                    { name: 'Formato', value: partida.formato, inline: true }
                )
                .setDescription(`⏳ Aguardando outro IGL aceitar a partida!\n\n⚠️ Você pode cancelar sua solicitação quando quiser.`)
                .setFooter({ text: 'Apenas admins podem cancelar ou registrar o resultado.' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('aceitarPartida')
                        .setLabel('✅ Aceitar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancelarPartida')
                        .setLabel('❌ Cancelar (Admins)')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('resultadoPartida')
                        .setLabel('🏆 Resultado (Admins)')
                        .setStyle(ButtonStyle.Primary)
                );

            const msgSolicitacao = await canalSolicitacoes.send({ embeds: [embed], components: [row] });
            await message.channel.send(`✅ Solicitação enviada para <#${canalSolicitacoesID}>`);

            // ------------------------------
            // Coletor de botões
            // ------------------------------
            const collector = msgSolicitacao.createMessageComponentCollector({ time: 86400000 }); // 24h

            collector.on('collect', async i => {

                // Cancelar partida
                if (i.customId === 'cancelarPartida') {
                    if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return i.reply({ content: '❌ Apenas admins podem cancelar esta partida.', ephemeral: true });
                    }
                    await i.update({ content: `❌ Partida de **${partida.nomeTime}** cancelada pelo admin.`, embeds: [], components: [] });
                    this.partidasPendentes.delete(partida.criador);
                }

                // Registrar resultado
                if (i.customId === 'resultadoPartida') {
                    if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return i.reply({ content: '❌ Apenas admins podem registrar o resultado.', ephemeral: true });
                    }

                    try {
                        await i.deferReply({ ephemeral: true });
                        const canalResultados = await message.guild.channels.fetch(canalResultadosID);
                        const filtroAdmin = m => m.author.id === i.user.id;

                        // Perguntar Time Vencedor
                        const vencedorMsg = await i.user.send('🏆 Qual time venceu a partida? Digite o nome completo do time:');
                        const vencedor = (await vencedorMsg.channel.awaitMessages({ filter: filtroAdmin, max: 1, time: 60000 })).first();
                        if (!vencedor) return i.followUp({ content: '❌ Tempo esgotado para registrar o vencedor.', ephemeral: true });

                        // Perguntar Placar
                        const placarMsg = await i.user.send('📊 Qual foi o placar final? Ex: 2 x 0');
                        const placar = (await placarMsg.channel.awaitMessages({ filter: filtroAdmin, max: 1, time: 60000 })).first();
                        if (!placar) return i.followUp({ content: '❌ Tempo esgotado para registrar o placar.', ephemeral: true });

                        // Perguntar Mapas
                        const mapasMsg = await i.user.send('🗺️ Quais mapas foram jogados? Separe por / ex: Train/Mirage');
                        const mapas = (await mapasMsg.channel.awaitMessages({ filter: filtroAdmin, max: 1, time: 60000 })).first();
                        if (!mapas) return i.followUp({ content: '❌ Tempo esgotado para registrar os mapas.', ephemeral: true });

                        // Embed resultado final
                        const embedResultado = new EmbedBuilder()
                            .setTitle('🏆 Resultado da Partida')
                            .setColor('Gold')
                            .addFields(
                                { name: 'Vencedor', value: vencedor.content },
                                { name: 'Placar', value: placar.content },
                                { name: 'Mapas jogados', value: mapas.content }
                            )
                            .setFooter({ text: `Registrado pelo admin ${i.user.tag}` })
                            .setTimestamp();

                        await canalResultados.send({ embeds: [embedResultado] });
                        await i.followUp({ content: '✅ Resultado registrado com sucesso!', ephemeral: true });
                        this.partidasPendentes.delete(partida.criador);

                    } catch (err) {
                        console.error('Erro ao registrar resultado:', err);
                        i.followUp({ content: '❌ Ocorreu um erro ao registrar o resultado.', ephemeral: true });
                    }
                }

                // Aceitar partida
                if (i.customId === 'aceitarPartida') {
                    if (i.user.id === partida.criador) return i.reply({ content: '❌ Você não pode aceitar sua própria partida.', ephemeral: true });

                    const categoria = await message.guild.channels.fetch(categoriaPartidasID);
                    const canalPrivado = await message.guild.channels.create({
                        name: `match-${partida.nomeTime}`,
                        type: ChannelType.GuildText,
                        parent: categoria.id,
                        permissionOverwrites: [
                            { id: message.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                            { id: partida.criador, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                            { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                        ]
                    });

                    await i.update({ content: `✅ Partida aceita! Canal privado criado: ${canalPrivado}`, components: [], embeds: [] });
                }

            });

        } catch (err) {
            console.error('Erro ao criar partida:', err);
            message.channel.send('❌ Ocorreu um erro ao criar a partida.');
        }
    }
};
