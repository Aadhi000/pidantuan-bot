const express = require('express');
const { chromium } = require('playwright-extra');
const stealth = require('./plugins/stealth')();
const TelegramBot = require('node-telegram-bot-api');

chromium.use(stealth); // ✅ enable stealth

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_TOKEN = "8378840441:AAFE1VBpj0lyFWoICKfMpF7crc1B13x5VV0";
const PIDANTUAN_USER = "aaaaasfhuiutt";
const PIDANTUAN_PASS = "114912@Aadil";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

async function claimAward() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // 1. Go to login page
    await page.goto('https://www.pidantuan.com/member.php?mod=logging&action=login&loginsubmit=yes&lssubmit=yes', { waitUntil: 'domcontentloaded' });

    // 2. Wait for Cloudflare challenge (longer)
    await page.waitForTimeout(30000);

    // 3. Simulate human behavior to bypass detection
    await page.mouse.move(100, 200, { steps: 10 });
    await page.waitForTimeout(2000);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(2000);

    // 4. Check if login form exists
    const loginSelector = 'input[name="username"]';
    const found = await page.$(loginSelector);

    if (!found) {
      throw new Error("Login form not found - Cloudflare likely blocked");
    }

    // 5. Fill login
    await page.fill(loginSelector, PIDANTUAN_USER);
    await page.fill('input[name="password"]', PIDANTUAN_PASS);
    await page.click('button[type="submit"], input[type="submit"]');

    await page.waitForLoadState('networkidle');

    // 6. Navigate to award page
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



