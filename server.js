const express = require('express');
const { chromium } = require('playwright');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Environment variables are directly taken from Render dashboard
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PIDANTUAN_USER = process.env.PIDANTUAN_USER;
const PIDANTUAN_PASS = process.env.PIDANTUAN_PASS;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// 🔹 Playwright automation
async function claimAward() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Use a real browser User-Agent to bypass Cloudflare detection
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    });

    // Visit login page
    await page.goto('https://www.pidantuan.com/member.php?mod=logging&action=login&loginsubmit=yes&lssubmit=yes', { waitUntil: 'domcontentloaded' });

    // ✅ Wait for Cloudflare challenge to complete (max 15s)
    await page.waitForTimeout(15000);

    // ✅ Wait for login form to appear
    await page.waitForSelector('input[name="username"]', { timeout: 30000 });

    // Fill in login credentials
    await page.fill('input[name="username"]', PIDANTUAN_USER);
    await page.fill('input[name="password"]', PIDANTUAN_PASS);

    // Submit login
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Go to award page
    await page.goto('https://www.pidantuan.com/plugin.php?id=are_sign:getaward&typeid=1', { waitUntil: 'networkidle' });

    const text = await page.textContent('body');

    await browser.close();
    return `✅ Award Page Response:\n\n${text.slice(0, 500)}...`;
  } catch (err) {
    await browser.close();
    return `❌ Error: ${err.message}`;
  }
}

// 🔹 Telegram command
bot.onText(/\/claim/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '⏳ Logging in to Pidantuan...');
  const result = await claimAward();
  bot.sendMessage(chatId, result);
});

// 🔹 Healthcheck route
app.get('/', (req, res) => res.send('✅ Playwright Telegram Bot running!'));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

