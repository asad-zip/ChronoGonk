const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { userTimezones } = require('../database');
const { isPingSafe, getTimePeriod } = require('../utils/timeHelpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check if it\'s a good time to ping someone')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Who do you want to ping?')
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const userId = targetUser.id;

        // check if user has timezone set
        const userData = userTimezones.get(userId);

        if (!userData) {
            return interaction.reply({
                content: `❌ **Can't check, choom.**\n\n` +
                         `${targetUser.username} hasn't set their timezone yet.\n` +
                         `They need to use \`/timezone set\` first.`,
                ephemeral: true
            });
        }

        const userTime = DateTime.now().setZone(userData.timezone);
        const safetyCheck = isPingSafe(userData.timezone);
        const period = getTimePeriod(userData.timezone);

        if (safetyCheck.safe) {
            return interaction.reply({
                content: `✅ **Good to go, choom.**\n\n` +
                         `It's ${userTime.toFormat('h:mm a')} for **${targetUser.username}** (${period}).\n` +
                         `Should be safe to ping them.`,
                ephemeral: true
            });
        } else {
            return interaction.reply({
                content: `${safetyCheck.warning}\n\n` +
                         `Maybe wait a bit or send a message they can see later.`,
                ephemeral: true
            });
        }
    },
};