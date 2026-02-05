const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('checks if the bot is responsive'),
    
    async execute(interaction) {
        await interaction.reply('Pong, gonk! Chronogonk is jacked in.');
    },
};
