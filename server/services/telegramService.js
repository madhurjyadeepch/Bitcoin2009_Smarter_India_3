const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Send a text message via Telegram Bot API
 */
const sendMessage = async (chatId, text) => {
  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.warn("TELEGRAM_BOT_TOKEN not configured, skipping Telegram message");
    return { ok: false, description: 'Bot token not configured' };
  }

  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram sendMessage failed:', data.description);
    }
    return data;
  } catch (err) {
    console.error('Telegram sendMessage error:', err.message);
    return { ok: false, description: err.message };
  }
};

/**
 * Send a photo with caption via Telegram Bot API
 */
const sendPhoto = async (chatId, photoUrl, caption) => {
  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') return { ok: false };

  try {
    const res = await fetch(`${BASE_URL}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption?.substring(0, 1024) || '',
        parse_mode: 'Markdown',
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Telegram sendPhoto error:', err.message);
    return { ok: false, description: err.message };
  }
};

/**
 * Get recent updates from the bot (to find chat IDs)
 */
const getUpdates = async () => {
  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    return { ok: false, result: [], description: 'Bot token not configured' };
  }

  try {
    const res = await fetch(`${BASE_URL}/getUpdates?limit=50`);
    return await res.json();
  } catch (err) {
    return { ok: false, result: [], description: err.message };
  }
};

/**
 * Sends a full assignment notification to a worker via Telegram
 */
const sendAssignmentNotification = async (worker, report) => {
  if (!worker.telegramChatId) {
    return { ok: false, description: 'No Telegram chat ID set for this worker' };
  }

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.address || '')}`;

  const message =
    `*CIVIC ISSUE ASSIGNED*\n\n` +
    `*Title:* ${report.title}\n` +
    `*Category:* ${report.category}\n` +
    `*Urgency:* ${report.aiAnalysis?.urgency || 'N/A'}\n` +
    `*Priority:* ${report.aiAnalysis?.priorityScore || 'N/A'}/100\n` +
    `*Location:* ${report.address}\n` +
    `*Maps:* ${mapsLink}\n\n` +
    `*Description:* ${report.description}\n` +
    `*Reported By:* ${report.author?.name || 'Anonymous'}`;

  // Try sending as text first (more reliable than photo URL from localhost)
  const result = await sendMessage(worker.telegramChatId, message);
  return result;
};

module.exports = { sendMessage, sendPhoto, sendAssignmentNotification, getUpdates };
