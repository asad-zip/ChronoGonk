const { DateTime } = require('luxon');

/**
 * Determines if a user is likely asleep based on their local time
 * @param {string} timezone - User's timezone
 * @returns {object} - { isAsleep: boolean, reason: string }
 */
function isLikelyAsleep(timezone) {
    const userTime = DateTime.now().setZone(timezone);
    const hour = userTime.hour;

    // Define sleep hours (midnight to 6am)
    if (hour >= 0 && hour < 6) {
        return {
            isAsleep: true,
            reason: `It's ${userTime.toFormat('h:mm a')} for them (late night)`
        };
    }

    // Late night (10pm - midnight)
    if (hour >= 22) {
        return {
            isAsleep: true,
            reason: `It's ${userTime.toFormat('h:mm a')} for them (likely winding down)`
        };
    }

    return {
        isAsleep: false,
        reason: null
    };
}

/**
 * Gets a descriptive time period label
 * @param {string} timezone - User's timezone
 * @returns {string} - "Early morning", "Morning", etc.
 */
function getTimePeriod(timezone) {
    const userTime = DateTime.now().setZone(timezone);
    const hour = userTime.hour;

    if (hour >= 0 && hour < 4) return 'Late night';
    if (hour >= 5 && hour < 9) return 'Early morning';
    if (hour >= 9 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    if (hour >= 21 && hour < 24) return 'Night';
}

/**
 * Calculates time until user is likely awake
 * @param {string} timezone - User's timezone
 * @returns {string|null} - Human-readable time or null if already awake
 */
function timeUntilAwake(timezone) {
    const sleepCheck = isLikelyAsleep(timezone);
    if (!sleepCheck.isAsleep) return null;

    const userTime = DateTime.now().setZone(timezone);
    const hour = userTime.hour;

    let wakeUpTime;
    
    // ff it's late night (10pm-midnight), they'll wake around 8am next day
    if (hour >= 22) {
        wakeUpTime = userTime.plus({ days: 1 }).set({ hour: 8, minute: 0 });
    } else {
        // ff it's early morning (midnight-6am), they'll wake around 8am same day
        wakeUpTime = userTime.set({ hour: 8, minute: 0 });
    }

    const diff = wakeUpTime.diff(userTime, ['hours', 'minutes']).toObject();
    
    if (diff.hours >= 1) {
        return `~${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m`;
    } else {
        return `~${Math.floor(diff.minutes)}m`;
    }
}

/**
 * Checks if it's a good time to ping someone
 * @param {string} timezone - User's timezone
 * @returns {object} - { safe: boolean, warning: string|null }
 */
function isPingSafe(timezone) {
    const sleepCheck = isLikelyAsleep(timezone);
    
    if (sleepCheck.isAsleep) {
        return {
            safe: false,
            warning: `⚠️ Hold up, choom. ${sleepCheck.reason}. They might not respond.`
        };
    }

    return {
        safe: true,
        warning: null
    };
}

/**
 * Finds the best time window when multiple users are awake
 * @param {Array} timezones - Array of timezone strings
 * @returns {string} - Description of best overlap time
 */
function findBestOverlap(timezones) {
    if (timezones.length < 2) {
        return "Need at least 2 people to find overlap times.";
    }

    // check next 24 hours in 1-hour increments
    const now = DateTime.now();
    const overlaps = [];

    for (let hour = 0; hour < 24; hour++) {
        const checkTime = now.plus({ hours: hour });
        const awakeCount = timezones.filter(tz => {
            const userTime = checkTime.setZone(tz);
            const userHour = userTime.hour;
            // consider awake if between 8am and 10pm
            return userHour >= 8 && userHour < 22;
        }).length;

        if (awakeCount === timezones.length) {
            overlaps.push({
                time: checkTime,
                hoursFromNow: hour
            });
        }
    }

    if (overlaps.length === 0) {
        return "No good overlap found in the next 24 hours. Your timezones are rough, choom.";
    }

    // find the soonest overlap
    const soonest = overlaps[0];
    
    if (soonest.hoursFromNow === 0) {
        return "Everyone's awake right now! Good time to call.";
    } else if (soonest.hoursFromNow === 1) {
        return `Best time: in about 1 hour (${soonest.time.toFormat('h:mm a')})`;
    } else {
        return `Best time: in ${soonest.hoursFromNow} hours (${soonest.time.toFormat('h:mm a')})`;
    }
}

module.exports = {
    isLikelyAsleep,
    getTimePeriod,
    timeUntilAwake,
    isPingSafe,
    findBestOverlap
};
