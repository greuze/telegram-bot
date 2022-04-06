const { TwitterApi } = require('twitter-api-v2');

const cluePattern = /Pista\s?\d\..+$/i;

module.exports.getClues = async function(twitterBearerToken, accountName) {
    const now = new Date();
    // Get start of the week (latest monday at 0:00). Works also on negative numbers for day, going to previous month
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);

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
        if (startOfWeek < tweetDate) {
            // Only handle tweets with clues
            const cluesMatch = cluePattern.exec(tweet.full_text);
            if (cluesMatch) {
                const dayResult = result[tweetDate.getDay()] || [];
                // Insert matching part of the regexp (the clue itself) in the first position of the array
                dayResult.unshift(cluesMatch[0].replace(/\s?https?:\/\/[\w.\/]+$/, ''));
                result[tweetDate.getDay()] = dayResult;
            }
        }
    }
    return result;
}
