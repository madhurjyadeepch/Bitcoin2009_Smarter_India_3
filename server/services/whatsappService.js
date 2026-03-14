/**
 * WhatsApp Messaging Service
 * 
 * Supports two modes:
 * 1. WhatsApp Business Cloud API (if WHATSAPP_PHONE_ID and WHATSAPP_ACCESS_TOKEN are set)
 * 2. Deep-link fallback (generates wa.me links for manual sending)
 */

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const isApiConfigured = () => {
  return PHONE_ID && ACCESS_TOKEN && PHONE_ID.length > 5;
};

/**
 * Build the notification text for a worker assignment
 */
const buildNotificationText = (worker, report) => {
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.address || '')}`;
  return (
    `🚨 *CIVIC ISSUE ASSIGNED*\n\n` +
    `📋 Title: ${report.title}\n` +
    `🏷 Category: ${report.category}\n` +
    `⚡ Urgency: ${report.aiAnalysis?.urgency || 'N/A'}\n` +
    `📊 Priority: ${report.aiAnalysis?.priorityScore || 'N/A'}/100\n` +
    `📍 Location: ${report.address}\n` +
    `🗺 Maps: ${mapsLink}\n\n` +
    `📝 Description: ${report.description}\n` +
    `👤 Reported By: ${report.author?.name || 'Anonymous'}`
  );
};

/**
 * Send message via WhatsApp Business Cloud API
 */
const sendWhatsAppMessage = async (phoneNumber, text) => {
  if (!isApiConfigured()) {
    return { ok: false, method: 'api', description: 'WhatsApp API not configured' };
  }

  // Normalize phone number (remove +, spaces, dashes)
  const phone = phoneNumber.replace(/[^0-9]/g, '');

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    });
    const data = await res.json();
    return { ok: !data.error, method: 'api', data, description: data.error?.message };
  } catch (err) {
    return { ok: false, method: 'api', description: err.message };
  }
};

/**
 * Generate a wa.me deep link as fallback
 */
const buildWhatsAppLink = (phoneNumber, text) => {
  const phone = phoneNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

/**
 * Send assignment notification to a worker via WhatsApp
 * Tries API first, falls back to deep link
 */
const sendAssignmentNotification = async (worker, report) => {
  if (!worker.whatsappNumber) {
    return { ok: false, method: 'none', description: 'No WhatsApp number set' };
  }

  const text = buildNotificationText(worker, report);

  // Try API first
  if (isApiConfigured()) {
    const result = await sendWhatsAppMessage(worker.whatsappNumber, text);
    if (result.ok) return result;
    // Fall through to deep link if API fails
  }

  // Fallback: deep link
  const link = buildWhatsAppLink(worker.whatsappNumber, text);
  return { ok: false, method: 'deeplink', whatsappLink: link, description: 'Using deep link (API not configured or failed)' };
};

module.exports = { sendWhatsAppMessage, buildWhatsAppLink, sendAssignmentNotification, isApiConfigured, buildNotificationText };
