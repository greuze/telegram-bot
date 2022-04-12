const { TwitterApi } = require('twitter-api-v2');

const cluePattern = /Pista\s?\d\..+$/i;

module.exports.getClues = async function(twitterBearerToken, accountName, pastWeeks) {
    const now = new Date();
    // Replaces sunday from 0 to 7, to get the clues from that week
    const day = now.getDay() || 7;
    // Get start of the week (latest monday at 0:00). Works also on negative numbers for day, going to previous month
    // pastWeeks indicates how many weeks must look back
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), (now.getDate() - day + 1) - (pastWeeks * 7));
    // End of the week to look for tweets
    const endOfWeek = startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000;

    const client = new TwitterApi(twitterBearerToken);
    const timeline = await client.v1.userTimelineByUsername(accountName, { count: 100, exclude_replies: true, include_rts: false });
    // @depeaparne => 1182595799089405952
    // const jackTimeline = await client.v1.userTimeline('1182595799089405952');

    let result = [];
    timeline.tweets
    // To loop only in the first page of the paginator. If iterating through "timeline", we get new request with new pages
    for (const tweet of timeline.tweets) {
        // Only handle tweets more recent that start of week
        const tweetDate = new Date(tweet.created_at);
        if (startOfWeek < tweetDate && tweetDate < endOfWeek) {
            // Only handle tweets with clues
            const cluesMatch = cluePattern.exec(tweet.full_text);
            if (cluesMatch) {
                const dayResult = result[tweetDate.getDay()] || { clues: [], date: new Intl.DateTimeFormat('es-ES').format(tweetDate)};
                // Insert matching part of the regexp (the clue itself) in the first position of the array
                dayResult.clues.unshift(cluesMatch[0].replace(/\s?https?:\/\/[\w.\/]+$/, ''));
                // Sunday keeps being 0, as it doesn't matter (no clues on weekend)
                result[tweetDate.getDay()] = dayResult;
            }
        }
    }
    return result;
}
