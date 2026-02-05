const { SlashCommandBuilder } = require('discord.js');
const { userActivity } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View server activity statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('activity')
                .setDescription('See who\'s been most active')
                .addIntegerOption(option =>
                    option
                        .setName('days')
                        .setDescription('Number of days to check (default: 7)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(30)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('today')
                .setDescription('See today\'s activity leaderboard')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'activity') {
            await handleActivity(interaction);
        } else if (subcommand === 'today') {
            await handleToday(interaction);
        }
    },
};

// handle /stats activity
async function handleActivity(interaction) {
    const days = interaction.options.getInteger('days') || 7;
    const activity = userActivity.getRecentActivity(days);

    if (activity.length === 0) {
        return interaction.reply({
            content: `❌ **No activity data yet, choom.**\n\nStart chatting and I'll track who's putting in work.`,
            ephemeral: false
        });
    }

    // build leaderboard
    let response = `📊 **Night City Activity Report** (Last ${days} days)\n\n`;

    // add rankings with medals
    activity.forEach((user, index) => {
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        else medal = `${index + 1}.`;

        response += `${medal} **${user.username}** - ${user.total_messages} messages\n`;
    });

    response += '\n';

    // chronoGonk's commentary
    const topUser = activity[0];
    const bottomUser = activity[activity.length - 1];

    // praise for most active
    const topPhrases = [
        `*${topUser.username}'s practically living in this chat. Preem dedication, choom.*`,
        `*Damn, ${topUser.username}, you carrying this whole server or what? Respect.*`,
        `*${topUser.username}'s got the most chrome in the streets. Everyone else step it up.*`,
        `*${topUser.username} putting in WORK. The rest of y'all are just gonks at this point.*`,
        `*${topUser.username}'s jacked in 24/7. That's some netrunner-level commitment.*`
    ];

    // roast for least active (if more than 2 people)
    const bottomPhrases = [
        `*${bottomUser.username}, you even remember this server exists? Ghost activity, choom.*`,
        `*${bottomUser.username}'s so quiet I thought they flatlined. You good?*`,
        `*${bottomUser.username}, the lurking is strong with this one. Say something, gonk.*`,
        `*${bottomUser.username} collecting dust over here. Wake up, choom.*`,
        `*${bottomUser.username}, you allergic to typing? Night city never sleeps.*`
    ];

    response += topPhrases[Math.floor(Math.random() * topPhrases.length)];

    if (activity.length > 2 && bottomUser.total_messages < topUser.total_messages / 3) {
        response += '\n';
        response += bottomPhrases[Math.floor(Math.random() * bottomPhrases.length)];
    }

    return interaction.reply({
        content: response,
        ephemeral: false
    });
}

// handle /stats today
async function handleToday(interaction) {
    const activity = userActivity.getToday();

    if (activity.length === 0) {
        return interaction.reply({
            content: `❌ **Dead quiet today.**\n\nNo one's said anything yet. Y'all still alive?`,
            ephemeral: false
        });
    }

    let response = `📊 **Today's Activity** 🌃\n\n`;

    activity.forEach((user, index) => {
        let medal = '';
        if (index === 0) medal = '🔥';
        else if (index === 1) medal = '⚡';
        else medal = '💬';

        response += `${medal} **${user.username}** - ${user.message_count} messages\n`;
    });

    response += '\n';

    // commentary for today
    const topUser = activity[0];

    const todayPhrases = [
        `*${topUser.username}'s on fire today. Keep it up, choom.*`,
        `*${topUser.username} woke up and wired. Respect.*`,
        `*${topUser.username}'s running the show today. Everyone else is slacking.*`,
        `*${topUser.username}'s got the most energy in Night City today.*`
    ];

    response += todayPhrases[Math.floor(Math.random() * todayPhrases.length)];

    return interaction.reply({
        content: response,
        ephemeral: false
    });
}