const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Analyze a civic issue image using Groq Vision model.
 * Returns suggested title, description, and category based on the image content.
 */
async function analyzeImage(imagePath, userHint = '') {
    try {
        // Read the image as base64
        const absolutePath = path.resolve(imagePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Image file not found: ${absolutePath}`);
        }

        const imageBuffer = fs.readFileSync(absolutePath);
        const base64Image = imageBuffer.toString('base64');

        // Determine MIME type from extension
        const ext = path.extname(imagePath).toLowerCase();
        const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
        const mimeType = mimeMap[ext] || 'image/jpeg';

        const systemPrompt = `You are an AI Civic Issue Analyst for a Smart City platform in India.
You analyze photos of civic issues submitted by citizens.

From the image, identify:
1. What civic issue is visible (e.g., pothole, garbage, broken streetlight, drainage problem, vandalism, fighting/violence, accident, etc.)
2. A concise, professional title for the issue (max 10 words)
3. A detailed description (2-3 sentences, formal tone) of what you observe
4. The most appropriate category from: pothole, garbage, streetlight, drainage, vandalism, general

Be very specific about what you see in the image. If you see people fighting, say so clearly.
If you see flooding, broken infrastructure, litter, etc., describe it accurately.

RESPOND ONLY in valid JSON:
{"suggestedTitle": "string", "suggestedDescription": "string", "suggestedCategory": "string", "confidence": "high|medium|low"}`;

        const userPrompt = userHint
            ? `Analyze this civic issue photo. The citizen mentioned: "${userHint}". Describe what you see and classify it.`
            : `Analyze this civic issue photo. Describe what you see and classify it.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: 'llama-3.2-90b-vision-preview',
            temperature: 0.3,
            max_tokens: 400,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) throw new Error('Empty AI response');

        const parsed = JSON.parse(raw);

        const validCategories = ['pothole', 'garbage', 'streetlight', 'drainage', 'vandalism', 'general'];

        return {
            suggestedTitle: parsed.suggestedTitle || 'Civic Issue Report',
            suggestedDescription: parsed.suggestedDescription || 'A civic issue was reported.',
            suggestedCategory: validCategories.includes(parsed.suggestedCategory?.toLowerCase())
                ? parsed.suggestedCategory.toLowerCase()
                : 'general',
            confidence: parsed.confidence || 'medium',
        };
    } catch (error) {
        console.error('Image analysis failed:', error.message);

        // If the vision model fails, try text-only fallback
        if (userHint) {
            return analyzeByText(userHint);
        }

        return {
            suggestedTitle: 'Civic Issue Report',
            suggestedDescription: 'Unable to analyze image. Please describe the issue manually.',
            suggestedCategory: 'general',
            confidence: 'low',
        };
    }
}

/**
 * Fallback: analyze by text description only (when image fails)
 */
async function analyzeByText(text) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You help citizens quickly file civic issue reports. Given a rough description of a problem, generate:
1. A concise, professional title (max 10 words)
2. A detailed description (2-3 sentences, formal tone)
3. The most appropriate category from: pothole, garbage, streetlight, drainage, vandalism, general

Respond ONLY in valid JSON:
{"suggestedTitle": "string", "suggestedDescription": "string", "suggestedCategory": "string", "confidence": "medium"}`
                },
                { role: 'user', content: `Problem: ${text}\n\nRespond with JSON only.` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.4,
            max_tokens: 200,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content;
        return JSON.parse(raw);
    } catch {
        return {
            suggestedTitle: 'Civic Issue Report',
            suggestedDescription: text,
            suggestedCategory: 'general',
            confidence: 'low',
        };
    }
}

module.exports = { analyzeImage, analyzeByText };
