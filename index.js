client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith('modalResultado_')) {
        const vencedor = interaction.fields.getTextInputValue('vencedor');
        const placar = interaction.fields.getTextInputValue('placar');
        const mapas = interaction.fields.getTextInputValue('mapas');

        const embedResultado = new EmbedBuilder()
            .setTitle('🏆 Resultado da Partida')
            .setColor('Gold')
            .addFields(
                { name: 'Vencedor', value: vencedor },
                { name: 'Placar', value: placar },
                { name: 'Mapas', value: mapas }
            )
            .setFooter({ text: `Registrado pelo admin ${interaction.user.tag}` })
            .setTimestamp();

        const canalResultados = await interaction.guild.channels.fetch('ID_CANAL_RESULTADOS');
        await canalResultados.send({ embeds: [embedResultado] });

        await interaction.reply({ content: '✅ Resultado registrado com sucesso!', ephemeral: true });

        // Remover partida pendente
        // this.partidasPendentes.delete(???)  <- se estiver acessível
    }
});
