const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

// Endpoint to fetch award content
app.get("/award", async (req, res) => {
  const username = req.query.username || "aaaaasfhuiutt";    // Your username
  const password = req.query.password || "114912@Aadil";     // Your password

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Go to login page
    await page.goto("https://www.pidantuan.com/member.php?mod=logging&action=login", { waitUntil: "networkidle2" });

    // Fill login form (adjust selectors if needed)
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    await page.click('button[type="submit"]'); // Adjust if site uses a different submit button
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Go to award page
    await page.goto("https://www.pidantuan.com/plugin.php?id=are_sign:getaward&typeid=1", { waitUntil: "networkidle2" });

    // Get page content
    const content = await page.content();

    await browser.close();
    res.send({ success: true, data: content });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Puppeteer API running on port ${PORT}`));
