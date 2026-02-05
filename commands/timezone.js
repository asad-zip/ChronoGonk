const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { userTimezones } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timezone')
        .setDescription('Manage your timezone settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your timezone')
                .addStringOption(option =>
                    option
                        .setName('timezone')
                        .setDescription('Your timezone (e.g., America/New_York, Europe/London, Asia/Tokyo)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your current timezone')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Remove your timezone from the system')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('See everyone\'s timezones and current times')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            await handleSet(interaction);
        } else if (subcommand === 'view') {
            await handleView(interaction);
        } else if (subcommand === 'clear') {
            await handleClear(interaction);
        } else if (subcommand === 'list') {
            await handleList(interaction);
        }
    },
};

// handle /timezone set
async function handleSet(interaction) {
    const timezoneInput = interaction.options.getString('timezone');
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // validate timezone
    if (!DateTime.local().setZone(timezoneInput).isValid) {
        return interaction.reply({
            content: `❌ **Invalid timezone, choom.**\n\n` +
                     `"${timezoneInput}" ain't recognized by the system.\n\n` +
                     `**Try formats like:**\n` +
                     `• \`America/New_York\`\n` +
                     `• \`Europe/London\`\n` +
                     `• \`Asia/Tokyo\`\n` +
                     `• \`Australia/Sydney\`\n\n` +
                     `[Full list of timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)`,
            ephemeral: true
        });
    }

    // get current time in specificied location
    const userTime = DateTime.now().setZone(timezoneInput);
    const timeString = userTime.toFormat('h:mm a');
    const dateString = userTime.toFormat('EEEE, MMMM d');

    // save to database
    userTimezones.set(userId, username, timezoneInput);

    return interaction.reply({
        content: `✅ **Timezone locked in, choom.**\n\n` +
                 `📍 **Your zone:** ${timezoneInput}\n` +
                 `🕐 **Your current time:** ${timeString}\n` +
                 `📅 **Date:** ${dateString}\n\n` +
                 `The crew can now see when you're awake or sleepin'.`,
        ephemeral: true
    });
}

// handle /timezone view
async function handleView(interaction) {
    const userId = interaction.user.id;
    const userData = userTimezones.get(userId);

    if (!userData) {
        return interaction.reply({
            content: `❌ **No timezone data found, choom.**\n\n` +
                     `You haven't set your timezone yet. Use \`/timezone set\` to get started.`,
            ephemeral: true
        });
    }

    const userTime = DateTime.now().setZone(userData.timezone);
    const timeString = userTime.toFormat('h:mm a');
    const dateString = userTime.toFormat('EEEE, MMMM d, yyyy');
    const offset = userTime.toFormat('ZZ');

    return interaction.reply({
        content: `🌐 **Your Timezone Info**\n\n` +
                 `📍 **Zone:** ${userData.timezone}\n` +
                 `🕐 **Current time:** ${timeString}\n` +
                 `📅 **Date:** ${dateString}\n` +
                 `⏱️ **UTC offset:** ${offset}`,
        ephemeral: true
    });
}

// handle /timezone clear
async function handleClear(interaction) {
    const userId = interaction.user.id;
    const userData = userTimezones.get(userId);

    if (!userData) {
        return interaction.reply({
            content: `❌ **Nothing to clear, choom.**\n\nYou don't have a timezone set.`,
            ephemeral: true
        });
    }

    userTimezones.delete(userId);

    return interaction.reply({
        content: `🗑️ **Timezone data wiped.**\n\nYour timezone has been removed from the system. The crew won't see your local time anymore.`,
        ephemeral: true
    });
}

// handle /timezone list
async function handleList(interaction) {
    const allUsers = userTimezones.getAll();

    if (allUsers.length === 0) {
        return interaction.reply({
            content: `❌ **No one's jacked into the time grid yet, choom.**\n\n` +
                     `Tell the crew to use \`/timezone set\` to get started.`,
            ephemeral: false
        });
    }

    let response = `🌐 **Night City Time Grid** 🌃\n\n`;

    // get current times for all users
    const userTimes = allUsers.map(user => {
        const dt = DateTime.now().setZone(user.timezone);
        return {
            username: user.username,
            timezone: user.timezone,
            time: dt.toFormat('h:mm a'),
            date: dt.toFormat('EEE, MMM d'),
            hour: dt.hour
        };
    });

    // sort by current hour (earliest to latest in their day)
    userTimes.sort((a, b) => a.hour - b.hour);

    // format each user
    userTimes.forEach(user => {
        // determine time of day emoji
        let emoji = '🌙'; // default: night
        if (user.hour >= 6 && user.hour < 12) emoji = '🌅'; // morning
        else if (user.hour >= 12 && user.hour < 17) emoji = '☀️'; // afternoon
        else if (user.hour >= 17 && user.hour < 21) emoji = '🌆'; // evening

        response += `${emoji} **${user.username}** · ${user.time} · ${user.date}\n`;
    });

    response += `\n💡 *Tip: Use \`/timezone set\` to add yourself to the grid.*`;

    return interaction.reply({
        content: response,
        ephemeral: false
    });
}