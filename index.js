const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

let stores = [];

function timeInterval() {
  (async () => {
    //live status of various KFC cities
    //Ngong-Rongai-Karen Addresses
    let nrkAddresses = [
      "./kenya/nrk/the-hub-karen.json",
      "./kenya/nrk/maiyan-mall-rongai.json",
      "./kenya/nrk/galleria-mall.json",
    ];
    for (let i = 0; i < nrkAddresses.length; i++) {
      const nrkAddress = nrkAddresses[i];

      // Launch the browser and open a new blank page
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

      //Load cookies
      const cookiesString = await fs.readFile(`${nrkAddress}`);
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);

      // Navigate the page to a URL
      await page.goto(
        "https://glovoapp.com/ke/en/Ngong-Rongai-Karen/restaurants_394/"
      );

      const now = new Date();
      const currentDateTime = now.toLocaleTimeString();

      try {
        let isBtnDisabled = false;
        while (!isBtnDisabled) {
          await page.waitForSelector(".store-card", {timeout:0});
          const storeNames = await page.$$(".store-card");

          for (const storeName of storeNames) {
            let title = "Null";
            let tag = "Open";

            const locationHandles = await page.waitForXPath(
              '//*[@id="user-address"]',{timeout:0}
            );
            try {
              location = await page.evaluate(
                (el) =>
                  el.querySelector("#user-address > div > div").textContent,
                locationHandles
              );
            } catch (error) {}

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

            stores.push({
              city: `Ngong-Rongai-Karen`,
              address: location,
              storename: title,
              storestatus: tag,
              time: currentDateTime,
            });
          }
          await page.waitForSelector(".next-page-link", {
            visible: true,
            timeout: 0,
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
      await browser.close();
    }
  })();
  (async () => {
    //Thika Addresses
    let thkAddresses = ["./kenya/thk/thika.json"];
    for (let i = 0; i < thkAddresses.length; i++) {
      const thkAddress = thkAddresses[i];

      // Launch the browser and open a new blank page
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

      //Load cookies
      const cookiesString = await fs.readFile(`${thkAddress}`);
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);

      // Navigate the page to a URL
      await page.goto("https://glovoapp.com/ke/en/thika/restaurants_394/");

      const now = new Date();
      const currentDateTime = now.toLocaleTimeString();

      try {
        let isBtnDisabled = false;
        while (!isBtnDisabled) {
          await page.waitForSelector(".store-card");
          const storeNames = await page.$$(".store-card");

          for (const storeName of storeNames) {
            let title = "Null";
            let tag = "Open";

            const locationHandles = await page.waitForXPath(
              '//*[@id="user-address"]'
            );
            try {
              location = await page.evaluate(
                (el) =>
                  el.querySelector("#user-address > div > div").textContent,
                locationHandles
              );
            } catch (error) {}

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

            stores.push({
              city: `Thika`,
              address: location,
              storename: title,
              storestatus: tag,
              time: currentDateTime,
            });
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
      await browser.close();
    }
  })();
}

let timer = setTimeout(function myTimer() {
  timeInterval();
  app.get("/stores/kfc", (req, res) => {
    const KFC = stores.filter(
      (a) => a.storename === "\n          KFC\n        "
    );

    //const kfcData = fs.writeFile('./kfc.json', JSON.stringify(KFC, null, 2));

    res.send(KFC);
  });
  timer = setTimeout(myTimer, 60 * 60 * 1000);
}, 1000);

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

/*
const scrapeLogic = async () => {
  let cities = [
    "Nairobi",
    "Mombasa",
    "Kisumu",
    "Nakuru",
    "Eldoret",
    "Syokimau",
    "Ngong-Rongai-Karen",
    "Kikuyu",
    "Thika",
    "Diani",
  ];
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];

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
      await page.goto(
        "https://glovoapp.com/ke/en/" + `${city}` + "/restaurants_394/",
        {
          waitUntil: "networkidle0",
          timeout: 0,
        }
      );

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

            stores.push({
              city: `${city}`,
              storename: title,
              storestatus: tag,
            });
          }
          await page.waitForSelector(".next-page-link", {
            visible: true,
            timeout: 0,
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
  }
  app.get("/", (req, res) => {
    res.send("Render Puppeteer server is up and running!");
  });

  app.get("/stores", function (req, res) {
    res.set("Access-Control-Allow-Origin", "*");
    res.send(stores);
  });
};

scrapeLogic();
*/
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
