const User = require('../models/userModel');
const Report = require('../models/reportModel');

/**
 * Recalculate trust score for a given user.
 * Factors:
 *   - Base score: 50
 *   - +5 per resolved report (max +25)
 *   - +1 per upvote received across all reports (max +20)
 *   - +3 per report submitted (max +15) — shows engagement
 *   - -10 per report deleted by admin (tracked via deletedByAdmin flag — future)
 * Score clamped to [0, 100]
 */
async function recalculateTrust(userId) {
    try {
        const reports = await Report.find({ author: userId });

        let score = 50; // base

        const totalReports = reports.length;
        const resolvedReports = reports.filter(r => r.status === 'resolved').length;
        let totalUpvotes = 0;
        reports.forEach(r => { totalUpvotes += (r.upvotedBy?.length || 0); });

        score += Math.min(resolvedReports * 5, 25);  // max +25 from resolutions
        score += Math.min(totalUpvotes, 20);           // max +20 from upvotes
        score += Math.min(totalReports * 3, 15);       // max +15 from engagement

        score = Math.max(0, Math.min(100, score));

        await User.findByIdAndUpdate(userId, { trustScore: score });

        return score;
    } catch (error) {
        console.error('Trust recalculation failed:', error.message);
        return 50;
    }
}

module.exports = { recalculateTrust };
