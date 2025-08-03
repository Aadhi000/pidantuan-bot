const express = require('express');
const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth')();
const TelegramBot = require('node-telegram-bot-api');

chromium.use(stealth); // ✅ enable stealth

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PIDANTUAN_USER = process.env.PIDANTUAN_USER;
const PIDANTUAN_PASS = process.env.PIDANTUAN_PASS;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

async function claimAward() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.pidantuan.com/member.php?mod=logging&action=login&loginsubmit=yes&lssubmit=yes', { waitUntil: 'domcontentloaded' });

    // ✅ Wait longer for Cloudflare
    await page.waitForTimeout(20000);

    // ✅ Wait for login form to appear after challenge
    await page.waitForSelector('input[name="username"]', { timeout: 45000 });

    await page.fill('input[name="username"]', PIDANTUAN_USER);
    await page.fill('input[name="password"]', PIDANTUAN_PASS);
    await page.click('button[type="submit"], input[type="submit"]');

    await page.waitForLoadState('networkidle');

    await page.goto('https://www.pidantuan.com/plugin.php?id=are_sign:getaward&typeid=1', { waitUntil: 'networkidle' });

    const text = await page.textContent('body');

    await browser.close();
    return `✅ Award Page Response:\n\n${text.slice(0, 500)}...`;
  } catch (err) {
    await browser.close();
    return `❌ Error: ${err.message}`;
  }
}

bot.onText(/\/claim/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '⏳ Bypassing Cloudflare & Logging in...');
  const result = await claimAward();
  bot.sendMessage(chatId, result);
});

app.get('/', (req, res) => res.send('✅ Stealth Playwright Bot running!'));
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
