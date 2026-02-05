const { SlashCommandBuilder } = require('discord.js');
const { userTimezones } = require('../database');
const { findBestOverlap } = require('../utils/timeHelpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('overlap')
        .setDescription('Find the best time when everyone is awake'),

    async execute(interaction) {
        const allUsers = userTimezones.getAll();

        if (allUsers.length < 2) {
            return interaction.reply({
                content: `❌ **Need more people on the grid.**\n\n` +
                         `At least 2 people need to set their timezones for this to work.`,
                ephemeral: true
            });
        }

        const timezones = allUsers.map(u => u.timezone);
        const result = findBestOverlap(timezones);

        return interaction.reply({
            content: `🕐 **Optimal Time Window**\n\n${result}\n\n` +
                     `*Checking schedules for: ${allUsers.map(u => u.username).join(', ')}*`,
            ephemeral: false
        });
    },
};