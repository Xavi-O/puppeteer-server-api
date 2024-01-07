const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

let stores = [];
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
  try {
    const page = await browser.newPage();

    //Prevent from loading images, styles and fonts
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() == "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate the page to a URL
    await page.goto("https://glovoapp.com/ke/en/kisumu/restaurants_394/", {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    try {
      let isBtnDisabled = false;
      while (!isBtnDisabled) {
        await page.waitForSelector(".store-card");
        const storeNames = await page.$$(".store-card");

        for (const storeName of storeNames) {
          let title = "Null";
          let tag = "Open";

          try {
            title = await page.evaluate(
              (el) =>
                el.querySelector(".store-card__footer__title").textContent,
              storeName
            );
          } catch (error) {}
          try {
            tag = await page.evaluate(
              (el) =>
                el.querySelector(
                  ".store-card__long-text-prevention > div > div"
                ).textContent,
              storeName
            );
          } catch (error) {}

          stores.push({ city: `${city}`, storename: title, storestatus: tag });
        }
        await page.waitForSelector(".next-page-link", {
          visible: true,
          timeout: 5000,
        });

        const is_disabled =
          (await page.$(".next-page-link--disabled")) !== null;

        isBtnDisabled = is_disabled;

        if (!is_disabled) {
          await page.click(".next-page-link");
          await page.waitForNavigation();
        }
      }
      //console.log(stores.length)
    } catch (error) {}
  } finally {
    await browser.close();
  }
};

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.get("/stores", function (req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.send(stores);
});
scrapeLogic();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
