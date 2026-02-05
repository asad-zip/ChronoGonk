const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { userTimezones, userStatuses } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Manage your availability status')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your availability status')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Your availability')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟢 Free - Available to chat/call', value: 'free' },
                            { name: '🟡 Busy - Working on something', value: 'busy' },
                            { name: '🔴 DND - Do Not Disturb', value: 'dnd' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('note')
                        .setDescription('Optional note (e.g., "studying", "at work", "gaming")')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Auto-clear after X minutes (optional)')
                        .setRequired(false)
                        .setMinValue(5)
                        .setMaxValue(1440) // 24 hours
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View someone\'s status')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to check (defaults to yourself)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear your status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('See everyone\'s availability and timezones')
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

// handle /status set
async function handleSet(interaction) {
    const statusType = interaction.options.getString('type');
    const note = interaction.options.getString('note');
    const duration = interaction.options.getInteger('duration');
    const userId = interaction.user.id;

    // save status to database
    userStatuses.set(userId, statusType, note, duration);

    const statusEmoji = {
        'free': '🟢',
        'busy': '🟡',
        'dnd': '🔴'
    };

    const statusLabel = {
        'free': 'Free',
        'busy': 'Busy',
        'dnd': 'Do Not Disturb'
    };

    let response = `${statusEmoji[statusType]} **Status updated, choom.**\n\n`;
    response += `**Availability:** ${statusLabel[statusType]}\n`;
    
    if (note) {
        response += `**Note:** ${note}\n`;
    }
    
    if (duration) {
        const expiresAt = DateTime.now().plus({ minutes: duration });
        response += `**Auto-clears:** in ${duration} minutes (${expiresAt.toFormat('h:mm a')})\n`;
    }

    response += `\nThe crew can now see your status with \`/status list\`.`;

    return interaction.reply({
        content: response,
        ephemeral: true
    });
}

// handle /status view
async function handleView(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userId = targetUser.id;

    const statusData = userStatuses.get(userId);

    if (!statusData) {
        const pronoun = targetUser.id === interaction.user.id ? 'You don\'t' : 'They don\'t';
        return interaction.reply({
            content: `❌ **No status set.**\n\n${pronoun} have an active status right now.`,
            ephemeral: true
        });
    }

    const statusEmoji = {
        'free': '🟢',
        'busy': '🟡',
        'dnd': '🔴'
    };

    const statusLabel = {
        'free': 'Free',
        'busy': 'Busy',
        'dnd': 'Do Not Disturb'
    };

    let response = `${statusEmoji[statusData.status]} **${targetUser.username}'s Status**\n\n`;
    response += `**Availability:** ${statusLabel[statusData.status]}\n`;

    if (statusData.note) {
        response += `**Note:** ${statusData.note}\n`;
    }

    if (statusData.expires_at) {
        const expiresAt = DateTime.fromSeconds(statusData.expires_at);
        const timeUntil = expiresAt.diffNow(['hours', 'minutes']).toObject();
        
        if (timeUntil.hours && timeUntil.hours >= 1) {
            response += `**Expires:** in ${Math.floor(timeUntil.hours)}h ${Math.floor(timeUntil.minutes)}m\n`;
        } else {
            response += `**Expires:** in ${Math.floor(timeUntil.minutes)}m\n`;
        }
    }

    return interaction.reply({
        content: response,
        ephemeral: true
    });
}

// handle /status clear
async function handleClear(interaction) {
    const userId = interaction.user.id;
    const statusData = userStatuses.get(userId);

    if (!statusData) {
        return interaction.reply({
            content: `❌ **No status to clear.**\n\nYou don't have an active status.`,
            ephemeral: true
        });
    }

    userStatuses.delete(userId);

    return interaction.reply({
        content: `🗑️ **Status cleared.**\n\nYour availability status has been removed.`,
        ephemeral: true
    });
}

// handle /status list
async function handleList(interaction) {
    userStatuses.cleanExpired();

    const allUsers = userTimezones.getAll();

    if (allUsers.length === 0) {
        return interaction.reply({
            content: `❌ **No one's on the grid yet.**\n\nUse \`/timezone set\` to get started.`,
            ephemeral: false
        });
    }

    // import time helpers
    const { isLikelyAsleep, timeUntilAwake } = require('../utils/timeHelpers');

    let response = `🌐 **Crew Status - Night City** 🌃\n\n`;

    // get data for all users
    const userData = allUsers.map(user => {
        const dt = DateTime.now().setZone(user.timezone);
        const status = userStatuses.get(user.user_id);
        const sleepCheck = isLikelyAsleep(user.timezone);
        
        return {
            username: user.username,
            timezone: user.timezone,
            time: dt.toFormat('h:mm a'),
            hour: dt.hour,
            status: status,
            userId: user.user_id,
            isAsleep: sleepCheck.isAsleep,
            sleepReason: sleepCheck.reason
        };
    });

    // sort by status priority (free > busy > dnd > asleep > no status), then by time
    const statusPriority = { 'free': 0, 'busy': 1, 'dnd': 2 };
    userData.sort((a, b) => {
        // Asleep users go to the bottom
        if (a.isAsleep !== b.isAsleep) {
            return a.isAsleep ? 1 : -1;
        }
        
        const aPriority = a.status ? statusPriority[a.status.status] : 3;
        const bPriority = b.status ? statusPriority[b.status.status] : 3;
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.hour - b.hour;
    });

    // format each user
    userData.forEach(user => {
        // determine time of day emoji
        let timeEmoji = '🌙';
        if (user.hour >= 6 && user.hour < 12) timeEmoji = '🌅';
        else if (user.hour >= 12 && user.hour < 17) timeEmoji = '☀️';
        else if (user.hour >= 17 && user.hour < 21) timeEmoji = '🌆';

        // status emoji
        const statusEmoji = {
            'free': '🟢',
            'busy': '🟡',
            'dnd': '🔴'
        };

        let emoji;
        if (user.isAsleep) {
            emoji = '😴'; // asleep overrides status
        } else {
            emoji = user.status ? statusEmoji[user.status.status] : '⚪';
        }

        response += `${emoji} ${timeEmoji} **${user.username}**\n`;
        response += `   ├ **Time:** ${user.time}\n`;

        if (user.isAsleep) {
            const wakeTime = timeUntilAwake(user.timezone);
            response += `   ├ **Status:** Likely asleep 💤\n`;
            if (wakeTime) {
                response += `   ├ **Awake in:** ${wakeTime}\n`;
            }
        } else if (user.status) {
            const statusLabel = {
                'free': 'Free',
                'busy': 'Busy',
                'dnd': 'Do Not Disturb'
            };
            response += `   ├ **Status:** ${statusLabel[user.status.status]}`;
            
            if (user.status.note) {
                response += ` · ${user.status.note}`;
            }
            response += '\n';

            if (user.status.expires_at) {
                const expiresAt = DateTime.fromSeconds(user.status.expires_at);
                const timeUntil = expiresAt.diffNow(['minutes']).toObject();
                response += `   ├ **Expires:** ~${Math.floor(timeUntil.minutes)}m\n`;
            }
        }

        response += '\n';
    });

    response += `💡 *Legend: 🟢 Free · 🟡 Busy · 🔴 DND · 😴 Asleep · ⚪ No status*`;

    return interaction.reply({
        content: response,
        ephemeral: false
    });
}