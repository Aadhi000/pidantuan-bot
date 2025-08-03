// Minimal Stealth Plugin for Playwright (local version)
module.exports = function stealthPlugin() {
  return {
    name: 'stealth',
    async onPageCreated(page) {
      await page.addInitScript(() => {
        // Basic stealth tweaks
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      });
    }
  };
};
