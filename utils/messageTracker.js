const { DateTime } = require('luxon');
const { userTimezones } = require('../database');

// track when we last warned each user (to avoid spam)
const lastWarnings = new Map();
const WARNING_COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds

// track recent channel activity (rolling 10-minute window)
const channelActivity = new Map();
const ACTIVITY_WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * add a message to the activity tracker
 * @param {string} channelId - Discord channel ID
 * @param {string} userId - Discord user ID
 */
function trackMessage(channelId, userId) {
    const now = Date.now();
    
    // get or create activity array for this channel
    if (!channelActivity.has(channelId)) {
        channelActivity.set(channelId, []);
    }
    
    const activity = channelActivity.get(channelId);
    
    // add new message
    activity.push({ userId, timestamp: now });
    
    // clean up old messages (older than 10 minutes)
    const filtered = activity.filter(msg => (now - msg.timestamp) < ACTIVITY_WINDOW);
    channelActivity.set(channelId, filtered);
}

/**
 * Get count of unique active users in a channel (last 10 minutes)
 * @param {string} channelId - Discord channel ID
 * @returns {number} - Count of unique active users
 */
function getActiveUserCount(channelId) {
    if (!channelActivity.has(channelId)) return 0;
    
    const activity = channelActivity.get(channelId);
    const uniqueUsers = new Set(activity.map(msg => msg.userId));
    
    return uniqueUsers.size;
}

/**
 * Check if a user is messaging at a late hour and should get a playful warning
 * @param {string} userId - Discord user ID
 * @param {string} channelId - Discord channel ID
 * @returns {object|null} - { shouldWarn: true, message: string, isGroup: boolean } or null
 */
function checkLateNightActivity(userId, channelId) {
    const userData = userTimezones.get(userId);
    
    // ff user hasn't set timezone, can't check
    if (!userData) return null;

    const userTime = DateTime.now().setZone(userData.timezone);
    const hour = userTime.hour;

    // check if it's late night (1am to 5am)
    if (hour >= 1 && hour < 5) {
        // check if this is a group conversation (2+ active users)
        const activeUsers = getActiveUserCount(channelId);
        const isGroup = activeUsers > 1;
        
        // check cooldown
        const lastWarning = lastWarnings.get(userId);
        const now = Date.now();

        if (lastWarning && (now - lastWarning) < WARNING_COOLDOWN) {
            return null; 
        }

        // update last warning time
        lastWarnings.set(userId, now);

        // generate warning message based on hour 
        let message;
        
        if (isGroup) {
            // group late night messages - different vibe
            const groupMessages = [
                `*Whole crew's flatlined and still jacked in? It's past ${userTime.toFormat('h a')}. Night City grind never stops, huh?*`,
                `*Y'all gonks know what time it is? ${userTime.toFormat('h:mm a')}. Corpo shifts don't start themselves, chooms.*`,
                `*Everyone's burning the midnight oil like it's 2077. ${userTime.toFormat('h a')} and still going. Respect.*`,
                `*This whole channel running on synth-coffee and bad decisions at ${userTime.toFormat('h:mm a')}?*`
            ];
            message = groupMessages[Math.floor(Math.random() * groupMessages.length)];
        } else {
            // solo late night - different messages per hour range
            if (hour >= 1 && hour < 2) {
                const messages = [
                    `*Choom, it's ${userTime.toFormat('h:mm a')}. Even the street rats are asleep. Jack out and get some rest.*`,
                    `*${userTime.toFormat('h:mm a')}? You're burning the candle at both ends, gonk. Crash before you flatline.*`,
                    `*Solo netrunning at ${userTime.toFormat('h:mm a')}? Preem dedication, but your organics needs sleep, choom.*`
                ];
                message = messages[Math.floor(Math.random() * messages.length)];
            } else if (hour >= 2 && hour < 4) {
                const messages = [
                    `*${userTime.toFormat('h:mm a')} and still wired in? That's some dedication, but even chrome needs downtime.*`,
                    `*Damn, ${userTime.toFormat('h:mm a')}. You running a gig or just can't sleep? Either way, you're gonna be fried tomorrow.*`,
                    `*It's ${userTime.toFormat('h:mm a')}, choom. Night City doesn't sleep, but you're not made of metal. Get some rest.*`
                ];
                message = messages[Math.floor(Math.random() * messages.length)];
            } else { // 4-5am
                const messages = [
                    `*${userTime.toFormat('h:mm a')}. You seeing the sun come up or did you never flatline? Go crash, gonk.*`,
                    `*The city's waking up and you still haven't slept? ${userTime.toFormat('h:mm a')}. That's not preem, that's a problem.*`,
                    `*${userTime.toFormat('h:mm a')}... either you're an early riser or you never went down. Either way, get your act together, choom.*`
                ];
                message = messages[Math.floor(Math.random() * messages.length)];
            }
        }

        return {
            shouldWarn: true,
            message: message,
            isGroup: isGroup
        };
    }

    return null;
}

module.exports = {
    trackMessage,
    getActiveUserCount,
    checkLateNightActivity
};