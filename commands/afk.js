const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { userStatuses } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Quick AFK status - marks you as busy temporarily')
        .addIntegerOption(option =>
            option
                .setName('minutes')
                .setDescription('How long you\'ll be gone (default: 30 minutes)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(960) // max 16 hours
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Why you\'re AFK (optional)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const duration = interaction.options.getInteger('minutes') || 30; // Default 30 min
        const reason = interaction.options.getString('reason') || 'AFK';
        const userId = interaction.user.id;

        // set status to busy with AFK note
        userStatuses.set(userId, 'busy', reason, duration);

        const expiresAt = DateTime.now().plus({ minutes: duration });

        return interaction.reply({
            content: `⏸️ **AFK mode activated, choom.**\n\n` +
                     `**Status:** Busy\n` +
                     `**Reason:** ${reason}\n` +
                     `**Back around:** ${expiresAt.toFormat('h:mm a')} (${duration} min)\n\n` +
                     `Your status will auto-clear when time's up.`,
            ephemeral: true
        });
    },
};