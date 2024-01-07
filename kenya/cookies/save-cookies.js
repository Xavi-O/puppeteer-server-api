const puppeteer = require('puppeteer');
const fs = require('fs').promises;

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: null,
        args: ["--force-device-scale-factor=0.5"],
    });
    const page = await browser.newPage();

    //*********IMPORTANT**********The url of the parent city
    await page.goto('https://glovoapp.com/ke/en/nairobi/', {
        waitUntil: "networkidle0",
    });

    await page.waitForTimeout(2000);

    const [locationSearch] = await page.$x('//*[@class="address-input"]');
    if (locationSearch) {
        await locationSearch.click();
    }

    await page.waitForTimeout(2000)

    await page.waitForXPath('//*[@class="helio-input__controls"]', {
        visible: true,
    });

    //*********IMPORTANT**********Input the store address that brings the first true suggestion
    await page.keyboard.type('KFC Mama Ngina');

    await page.waitForTimeout(3000)

    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000)

    //Get cookies
    const cookies = await page.cookies()

    //*********IMPORTANT**********Save cookies to file
    await fs.writeFile('../nbo/mama-ngina.json', JSON.stringify(cookies, null, 2));

    console.log('Success!!!')

    await browser.close();
})();