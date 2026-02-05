const { SlashCommandBuilder } = require('discord.js');
const { userStatuses } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('back')
        .setDescription('Clear your AFK/busy status - you\'re back!'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const statusData = userStatuses.get(userId);

        if (!statusData) {
            return interaction.reply({
                content: `❌ **You don't have an active status, choom.**\n\nNothing to clear.`,
                ephemeral: true
            });
        }

        userStatuses.delete(userId);

        return interaction.reply({
            content: `✅ **Welcome back, choom!**\n\nYour status has been cleared. The crew knows you're around now.`,
            ephemeral: true
        });
    },
};