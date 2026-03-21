const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS = (process.env.TELEGRAM_ADMIN_CHAT_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || CHAT_IDS.length === 0) return;
  await Promise.allSettled(
    CHAT_IDS.map((chatId) =>
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      })
    )
  );
}
