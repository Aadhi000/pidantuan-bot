require('dotenv').config();
const express = require('express');
const { chromium } = require('playwright');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Load credentials from environment
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PIDANTUAN_USER = process.env.PIDANTUAN_USER;
const PIDANTUAN_PASS = process.env.PIDANTUAN_PASS;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// 🔹 Playwright automation function
async function claimAward() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // Go to login
    await page.goto('https://www.pidantuan.com/member.php?mod=logging&action=login&loginsubmit=yes&lssubmit=yes', { waitUntil: 'domcontentloaded' });

    // Fill login form
    await page.fill('input[name="username"]', PIDANTUAN_USER);
    await page.fill('input[name="password"]', PIDANTUAN_PASS);

    // Submit login
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Visit award page
    await page.goto('https://www.pidantuan.com/plugin.php?id=are_sign:getaward&typeid=1', { waitUntil: 'networkidle' });

    // Extract message
    const text = await page.textContent('body');

    await browser.close();
    return `✅ Award Page Response:\n\n${text.slice(0, 500)}...`; // limit output
  } catch (err) {
    await browser.close();
    return `❌ Error: ${err.message}`;
  }
}

// 🔹 Telegram Bot Command
bot.onText(/\/claim/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '⏳ Logging in to Pidantuan and claiming award...');
  const result = await claimAward();
  bot.sendMessage(chatId, result);
});

// 🔹 Express for Render health check
app.get('/', (req, res) => res.send('✅ Playwright + Telegram Bot is running!'));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
