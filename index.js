const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

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

    await page.goto(
      "https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=double%20crunch%20burger",
      {waitUntil: 'domcontentloaded', timeout: 0}
    );

    // Locate the full title with a unique string
    const textSelector = await page.waitForSelector(
      ".product-row__content > div > div.product-row__name"
    );
    const fullTitle = await textSelector.evaluate((el) => el.textContent);

    // Print the full title
    const logStatement = `The title of this product is ${fullTitle}`;
    console.log(logStatement);
    app.get("/scrape", (req, res) => {
      res.send(logStatement);
    });
  } catch (e) {
    console.error(e);
    app.get("/scrape", (req, res) => {
      res.send(`Something went wrong while running Puppeteer: ${e}`);
    });
  } finally {
    await browser.close();
  }
  app.get("/", (req, res) => {
    res.send("Render Puppeteer server is up and running!");
  });
};
scrapeLogic();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
