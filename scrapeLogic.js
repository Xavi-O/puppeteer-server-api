const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--force-device-scale-factor=0.5",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  const page = await browser.newPage();

  await page.goto("https://glovoapp.com/ke/en/nairobi/kfc-nbo/", {
    waitUntil: "networkidle0",
  });

  // Set screen size
  await page.setViewport(null);

  const [search] = await page.$x('//*[@class="search-input"]');
  if (search) {
    await search.click();
  }

  let searchText = await page.waitForXPath('//*[@class="search-input__field"]');
  await searchText.type("doublecrunchburger");

  await page.waitForSelector(".product-row", {
    visible: true,
  });

  const productHandles = await page.$$(".store__body__dynamic-content");
  for (const productHandle of productHandles) {
    title = await page.evaluate(
      (el) =>
        el.querySelector(".product-row__content > div > div.product-row__name")
          .textContent,
      productHandle
    );

    price = await page.evaluate(
      (el) =>
        el.querySelector(
          ".product-price__effective.product-price__effective--new-card"
        ).textContent,
      productHandle
    );
    console.log(title, price);
  }

  await browser.close();
};

module.exports = { scrapeLogic };
