const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DEPARTMENT_MAP = {
    'pothole': 'Road & Infrastructure',
    'garbage': 'Sanitation & Waste Management',
    'streetlight': 'Electricity & Lighting',
    'drainage': 'Water & Drainage',
    'vandalism': 'Law Enforcement & Security',
    'general': 'General Municipal Services',
};

/**
 * Analyzes a civic report using Groq AI (acts as 4 agents in one call):
 * 1. Classification Agent — verifies/corrects category
 * 2. Urgency Agent — determines urgency level
 * 3. Priority Agent — assigns priority score 0-100
 * 4. Routing Agent — routes to correct department
 */
async function analyzeReport(title, description, category, address) {
    const systemPrompt = `You are an AI Civic Operations Analyst for a Smart City platform. 
You analyze civic issue reports submitted by citizens. You act as 4 specialized agents simultaneously:

1. CLASSIFICATION AGENT: Verify or correct the citizen's category choice. Valid categories: pothole, garbage, streetlight, drainage, vandalism, general.
2. URGENCY AGENT: Determine urgency based on safety risk, public impact, and severity. Levels: low, medium, high, critical.
3. PRIORITY AGENT: Assign a numeric priority score from 0-100. Consider: safety risk (40%), public impact/population density (30%), infrastructure importance (20%), urgency of repair (10%).
4. ROUTING AGENT: Route to the correct department: "Road & Infrastructure", "Sanitation & Waste Management", "Electricity & Lighting", "Water & Drainage", "Law Enforcement & Security", or "General Municipal Services".

Also generate a brief professional summary (1-2 sentences) of the issue for authority dashboard.

RESPOND ONLY IN VALID JSON with this exact structure:
{
  "verifiedCategory": "string",
  "urgency": "low|medium|high|critical",
  "priorityScore": number,
  "department": "string",
  "aiSummary": "string"
}`;

    const userPrompt = `Analyze this civic issue report:

Title: ${title}
Description: ${description}
Category (citizen-selected): ${category}
Location: ${address}

Respond ONLY with valid JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 300,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) throw new Error('Empty AI response');

        const parsed = JSON.parse(raw);

        // Validate and sanitize
        const validCategories = ['pothole', 'garbage', 'streetlight', 'drainage', 'vandalism', 'general'];
        const validUrgency = ['low', 'medium', 'high', 'critical'];

        return {
            verifiedCategory: validCategories.includes(parsed.verifiedCategory?.toLowerCase())
                ? parsed.verifiedCategory.toLowerCase() : category.toLowerCase(),
            urgency: validUrgency.includes(parsed.urgency?.toLowerCase())
                ? parsed.urgency.toLowerCase() : 'medium',
            priorityScore: Math.max(0, Math.min(100, parseInt(parsed.priorityScore) || 50)),
            department: parsed.department || DEPARTMENT_MAP[category.toLowerCase()] || 'General Municipal Services',
            aiSummary: parsed.aiSummary || `${category} issue reported at ${address}.`,
        };
    } catch (error) {
        console.error('AI Analysis failed:', error.message);
        // Fallback: provide basic analysis without AI
        return {
            verifiedCategory: category.toLowerCase(),
            urgency: 'medium',
            priorityScore: 50,
            department: DEPARTMENT_MAP[category.toLowerCase()] || 'General Municipal Services',
            aiSummary: `${category} issue reported at ${address}. AI analysis pending.`,
        };
    }
}

/**
 * Extract city name from an address string using simple heuristics.
 * Falls back to the full address if parsing fails.
 */
function extractCity(address) {
    if (!address) return 'Unknown';
    // Common pattern: "..., City, PostalCode" or "..., City"
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
        // Usually the second-to-last part is the city
        const candidate = parts[parts.length - 2] || parts[parts.length - 1];
        // Remove postal codes
        return candidate.replace(/\d{5,}/g, '').trim() || parts[0];
    }
    return parts[0] || 'Unknown';
}

module.exports = { analyzeReport, extractCity };
