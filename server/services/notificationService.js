const https = require("https");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const STATUS_MESSAGES = {
  "received": "Your report has been received and logged.",
  "under-review": "Your report is now under review by an authority.",
  "assigned": "A field worker has been assigned to your issue.",
  "work-in-progress": "Work has started on resolving your issue.",
  "verification": "The fix is being verified on-site.",
  "resolved": "Your issue has been resolved. Thank you for reporting!",
  "closed": "Your report has been closed. We appreciate your contribution.",
};

/**
 * Send push notification via Expo Push API
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return null;

  const payload = JSON.stringify({
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
  });

  return new Promise((resolve, reject) => {
    const url = new URL(EXPO_PUSH_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(JSON.parse(data)));
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

/**
 * Notify report author about status change
 */
const notifyStatusChange = async (user, report, newStatus) => {
  if (!user?.pushToken) return;

  const body = STATUS_MESSAGES[newStatus] || `Status updated to: ${newStatus}`;
  const title = `Update: ${report.title}`;

  try {
    await sendPushNotification(user.pushToken, title, body, {
      reportId: report._id,
      status: newStatus,
    });
  } catch (err) {
    console.error("Push notification failed:", err.message);
  }
};

module.exports = { sendPushNotification, notifyStatusChange, STATUS_MESSAGES };
