const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

let lastUpdateOffset = 0;

/**
 * Check if the bot token is properly configured
 */
const isConfigured = () => {
  return BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE' && BOT_TOKEN.length > 10;
};

/**
 * Send a text message via Telegram Bot API
 */
const sendMessage = async (chatId, text) => {
  if (!isConfigured()) {
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
  if (!isConfigured()) return { ok: false };

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
 * Get recent updates from the bot with proper offset tracking.
 * Uses offset to avoid seeing old messages, ensuring fresh data each time.
 */
const getUpdates = async (useOffset = false) => {
  if (!isConfigured()) {
    return { ok: false, result: [], description: 'Bot token not configured' };
  }

  try {
    const params = new URLSearchParams({ limit: '100', timeout: '5' });
    if (useOffset && lastUpdateOffset > 0) {
      params.set('offset', String(lastUpdateOffset));
    }
    const res = await fetch(`${BASE_URL}/getUpdates?${params}`);
    const data = await res.json();

    // Track the offset so next call doesn't return stale data
    if (data.ok && data.result && data.result.length > 0) {
      const maxId = Math.max(...data.result.map(u => u.update_id));
      lastUpdateOffset = maxId + 1;
    }

    return data;
  } catch (err) {
    return { ok: false, result: [], description: err.message };
  }
};

/**
 * Get ALL updates without offset (to show all historical chat IDs)
 */
const getAllUpdates = async () => {
  if (!isConfigured()) {
    return { ok: false, result: [], description: 'Bot token not configured' };
  }

  try {
    const res = await fetch(`${BASE_URL}/getUpdates?limit=100&timeout=5`);
    return await res.json();
  } catch (err) {
    return { ok: false, result: [], description: err.message };
  }
};

/**
 * Get bot info to verify the token works
 */
const getBotInfo = async () => {
  if (!isConfigured()) return { ok: false, description: 'Bot token not configured' };
  try {
    const res = await fetch(`${BASE_URL}/getMe`);
    return await res.json();
  } catch (err) {
    return { ok: false, description: err.message };
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
    `🚨 *CIVIC ISSUE ASSIGNED*\n\n` +
    `📋 *Title:* ${report.title}\n` +
    `🏷 *Category:* ${report.category}\n` +
    `⚡ *Urgency:* ${report.aiAnalysis?.urgency || 'N/A'}\n` +
    `📊 *Priority:* ${report.aiAnalysis?.priorityScore || 'N/A'}/100\n` +
    `📍 *Location:* ${report.address}\n` +
    `🗺 *Maps:* ${mapsLink}\n\n` +
    `📝 *Description:* ${report.description}\n` +
    `👤 *Reported By:* ${report.author?.name || 'Anonymous'}`;

  const result = await sendMessage(worker.telegramChatId, message);
  return result;
};

module.exports = { sendMessage, sendPhoto, sendAssignmentNotification, getUpdates, getAllUpdates, getBotInfo, isConfigured };
