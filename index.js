const express = require('express')
const puppeteer = require('puppeteer');
const { Cluster } = require('puppeteer-cluster');
const fs = require('fs').promises;
const app = express()

let stores = [];
let product = [];
let time = [];

(async () => {

    //live status of various cities
    let cities = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Syokimau', 'Ngong-Rongai-Karen', 'Kikuyu', 'Thika', 'Diani'];
    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];

        // Launch the browser and open a new blank page
        const browser = await puppeteer.launch({
            headless: "new",
            defaultViewport: null,
            args: ["--force-device-scale-factor=0.5"],
        });
        const page = await browser.newPage();

        //Prevent from loading images, styles and fonts
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                req.abort();
            }
            else {
                req.continue();
            }
        });

        // Navigate the page to a URL
        await page.goto('https://glovoapp.com/ke/en/' + `${city}` + '/restaurants_394/');

        try {
            let isBtnDisabled = false
            while (!isBtnDisabled) {
                await page.waitForSelector(".store-card")
                const storeNames = await page.$$('.store-card');

                for (const storeName of storeNames) {

                    let title = "Null";
                    let tag = "Open";

                    try {
                        title = await page.evaluate(
                            (el) => el.querySelector(".store-card__footer__title").textContent, storeName
                        );
                    } catch (error) { }
                    try {
                        tag = await page.evaluate(
                            (el) => el.querySelector(".store-card__long-text-prevention > div > div").textContent, storeName
                        );
                    } catch (error) { }

                    stores.push({ "city": `${city}`, "storename": title, "storestatus": tag })

                }
                await page.waitForSelector('.next-page-link', { visible: true, timeout: 5000 })

                const is_disabled = await page.$('.next-page-link--disabled') !== null;

                isBtnDisabled = is_disabled

                if (!is_disabled) {
                    await page.click('.next-page-link')
                    await page.waitForNavigation()
                }
            }
            //console.log(stores.length)
        } catch (error) { }

        await browser.close();
    }

    //Nairobi Addresses
    let nboAddresses = [
        "./kenya/nbo/hurlingham.json", "./kenya/nbo/junction-mall.json", "./kenya/nbo/shell-langata.json",
        "./kenya/nbo/lavington.json", './kenya/nbo/imara-daima.json', './kenya/nbo/woodvale.json',
        './kenya/nbo/buruburu.json', './kenya/nbo/waiyaki-way.json', './kenya/nbo/limuru-rd.json',
        './kenya/nbo/kasarani.json', './kenya/nbo/kiambu-rd.json', './kenya/nbo/eastleigh.json',
        './kenya/nbo/kimathi-street.json', './kenya/nbo/southfield-mall.json', './kenya/nbo/garden-city.json',
        './kenya/nbo/embakasi.json', './kenya/nbo/village-market.json', './kenya/nbo/westgate.json',
        './kenya/nbo/northview.json', './kenya/nbo/mama-ngina.json'
    ];
    for (let i = 0; i < nboAddresses.length; i++) {
        const nboAddress = nboAddresses[i];

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 20,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: null,
                args: ["--force-device-scale-factor=0.5"],
            }
        });

        await cluster.task(async ({ page, data: url }) => {

            //Prevent from loading images, styles and fonts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });

            //Load cookies
            const cookiesString = await fs.readFile(`${nboAddress}`);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);

            await page.goto(url, { waitUntil: 'domcontentloaded' }); //Go to the search link of the first product

            //Extract the title name of the product and its price
            try {
                const productHandles = await page.$$('.store__body__dynamic-content');
                for (const productHandle of productHandles) {
                    const locationHandles = await page.waitForXPath('//*[@id="user-address"]');
                    location = await page.evaluate
                        (el => el.querySelector('#user-address > div > div')
                            .textContent, locationHandles)

                    title = await page.evaluate
                        (el => el.querySelector('.product-row__content > div > div.product-row__name')
                            .textContent, productHandle)

                    price = await page.evaluate
                        (el => el.querySelector('.product-price__effective.product-price__effective--new-card')
                            .textContent, productHandle)

                    product.push({ "city": "NBO", "address": location, "title": title, "price": price })
                    //console.log({ "city": "NBO", "address": location, "title": title, "price": price })
                }
            } catch (error) {
                product.push({ "city": "NBO", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
                //console.log({ "city": "NBO", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
            }

            //await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.close();

        });

        cluster.queue('https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=Rice Bliss');
        cluster.queue('https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=Streetwise 2');
        cluster.queue('https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=Streetwise 3');
        cluster.queue('https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=Streetwise 5');
        cluster.queue('https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=Streetwise 7');
        cluster.queue('https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=KFC Krusher');
        cluster.queue('https://glovoapp.com/ke/en/nairobi/kfc-nbo?search=Double Crunch Burger');

        // List of product search pages

        await cluster.idle();
        await cluster.close();
    }

    //Mombasa Addresses
    let mbsAddresses = ["./kenya/mbs/mbs-cbd.json", "./kenya/mbs/nyali-rd.json"];
    for (let i = 0; i < mbsAddresses.length; i++) {
        const mbsAddress = mbsAddresses[i];

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 20,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: null,
                args: ["--force-device-scale-factor=0.5"],
            }
        });

        await cluster.task(async ({ page, data: url }) => {

            //Prevent from loading images, styles and fonts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });

            //Load cookies
            const cookiesString = await fs.readFile(`${mbsAddress}`);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);

            await page.goto(url, { waitUntil: 'domcontentloaded' }); //Go to the search link of the first product

            //Extract the title name of the product and its price
            try {
                const productHandles = await page.$$('.store__body__dynamic-content');
                for (const productHandle of productHandles) {
                    const locationHandles = await page.waitForXPath('//*[@id="user-address"]');
                    location = await page.evaluate
                        (el => el.querySelector('#user-address > div > div')
                            .textContent, locationHandles)

                    title = await page.evaluate
                        (el => el.querySelector('.product-row__content > div > div.product-row__name')
                            .textContent, productHandle)

                    price = await page.evaluate
                        (el => el.querySelector('.product-price__effective.product-price__effective--new-card')
                            .textContent, productHandle)

                    product.push({ "city": "MBS", "address": location, "title": title, "price": price })
                    //console.log({ "city": "MBS", "address": location, "title": title, "price": price })
                }
            } catch (error) {
                product.push({ "city": "MBS", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
                //console.log({ "city": "MBS", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
            }

            //await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.close();

        });

        cluster.queue('https://glovoapp.com/ke/en/mombasa/kfc-mombasa?search=Rice Bliss');
        cluster.queue('https://glovoapp.com/ke/en/mombasa/kfc-mombasa?search=Streetwise 2');
        cluster.queue('https://glovoapp.com/ke/en/mombasa/kfc-mombasa?search=Streetwise 3');
        cluster.queue('https://glovoapp.com/ke/en/mombasa/kfc-mombasa?search=Streetwise 5');
        cluster.queue('https://glovoapp.com/ke/en/mombasa/kfc-mombasa?search=Streetwise 7');
        cluster.queue('https://glovoapp.com/ke/en/mombasa/kfc-mombasa?search=KFC Krusher');
        cluster.queue('https://glovoapp.com/ke/en/mombasa/kfc-mombasa?search=Double Crunch Burger');

        // List of product search pages

        await cluster.idle();
        await cluster.close();
    }

    //Ngong-Rongai-Karen Addresses
    let nrkAddresses = ["./kenya/nrk/the-hub-karen.json", "./kenya/nrk/maiyan-mall-rongai.json", "./kenya/nrk/galleria-mall.json"];
    for (let i = 0; i < nrkAddresses.length; i++) {
        const nrkAddress = nrkAddresses[i];

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 20,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: null,
                args: ["--force-device-scale-factor=0.5"],
            }
        });

        await cluster.task(async ({ page, data: url }) => {

            //Prevent from loading images, styles and fonts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });

            //Load cookies
            const cookiesString = await fs.readFile(`${nrkAddress}`);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);

            await page.goto(url, { waitUntil: "domcontentloaded" }); //Go to the search link of the first product

            //Extract the title name of the product and its price
            try {
                const productHandles = await page.$$('.store__body__dynamic-content');
                for (const productHandle of productHandles) {
                    const locationHandles = await page.waitForXPath('//*[@id="user-address"]');
                    location = await page.evaluate
                        (el => el.querySelector('#user-address > div > div')
                            .textContent, locationHandles)

                    title = await page.evaluate
                        (el => el.querySelector('.product-row__content > div > div.product-row__name')
                            .textContent, productHandle)

                    price = await page.evaluate
                        (el => el.querySelector('.product-price__effective.product-price__effective--new-card')
                            .textContent, productHandle)

                    product.push({ "city": "NRK", "address": location, "title": title, "price": price })
                    //console.log({ "city": "NRK", "address": location, "title": title, "price": price })
                }
            } catch (error) {
                product.push({ "city": "NRK", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
                //console.log({ "city": "NRK", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
            }

            //await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.close();
        });

        cluster.queue('https://glovoapp.com/ke/en/ngong-rongai-karen/kfc-nrk?search=Rice Bliss');
        cluster.queue('https://glovoapp.com/ke/en/ngong-rongai-karen/kfc-nrk?search=Streetwise 2');
        cluster.queue('https://glovoapp.com/ke/en/ngong-rongai-karen/kfc-nrk?search=Streetwise 3');
        cluster.queue('https://glovoapp.com/ke/en/ngong-rongai-karen/kfc-nrk?search=Streetwise 5');
        cluster.queue('https://glovoapp.com/ke/en/ngong-rongai-karen/kfc-nrk?search=Streetwise 7');
        cluster.queue('https://glovoapp.com/ke/en/ngong-rongai-karen/kfc-nrk?search=KFC Krusher');
        cluster.queue('https://glovoapp.com/ke/en/ngong-rongai-karen/kfc-nrk?search=Double Crunch Burger');

        // List of product search pages

        await cluster.idle();
        await cluster.close();

    }

    //Nakuru Addresses
    let nakAddresses = ["./kenya/nak/westend-mall.json", "./kenya/nak/hyrax.json"];
    for (let i = 0; i < nakAddresses.length; i++) {
        const nakAddress = nakAddresses[i];

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 20,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: null,
                args: ["--force-device-scale-factor=0.5"],
            }
        });

        await cluster.task(async ({ page, data: url }) => {

            //Prevent from loading images, styles and fonts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });

            //Load cookies
            const cookiesString = await fs.readFile(`${nakAddress}`);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);

            await page.goto(url, { waitUntil: 'domcontentloaded' }); //Go to the search link of the first product

            //Extract the title name of the product and its price
            try {
                const productHandles = await page.$$('.store__body__dynamic-content');
                for (const productHandle of productHandles) {
                    const locationHandles = await page.waitForXPath('//*[@id="user-address"]');
                    location = await page.evaluate
                        (el => el.querySelector('#user-address > div > div')
                            .textContent, locationHandles)

                    title = await page.evaluate
                        (el => el.querySelector('.product-row__content > div > div.product-row__name')
                            .textContent, productHandle)

                    price = await page.evaluate
                        (el => el.querySelector('.product-price__effective.product-price__effective--new-card')
                            .textContent, productHandle)

                    product.push({ "city": "NAK", "address": location, "title": title, "price": price })
                    //console.log({ "city": "NAK", "address": location, "title": title, "price": price })
                }
            } catch (error) {
                product.push({ "city": "NAK", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
                //console.log({ "city": "NAK", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
            }

            //await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.close();

        });

        cluster.queue('https://glovoapp.com/ke/en/nakuru/kfc-nakuru-nak-ke?search=Rice Bliss');
        cluster.queue('https://glovoapp.com/ke/en/nakuru/kfc-nakuru-nak-ke?search=Streetwise 2');
        cluster.queue('https://glovoapp.com/ke/en/nakuru/kfc-nakuru-nak-ke?search=Streetwise 3');
        cluster.queue('https://glovoapp.com/ke/en/nakuru/kfc-nakuru-nak-ke?search=Streetwise 5');
        cluster.queue('https://glovoapp.com/ke/en/nakuru/kfc-nakuru-nak-ke?search=Streetwise 7');
        cluster.queue('https://glovoapp.com/ke/en/nakuru/kfc-nakuru-nak-ke?search=KFC Krusher');
        cluster.queue('https://glovoapp.com/ke/en/nakuru/kfc-nakuru-nak-ke?search=Double Crunch Burger');

        // List of product search pages

        await cluster.idle();
        await cluster.close();
    }

    //Eldoret Addresses
    let eldAddresses = ["./kenya/eld/rupa-place.json"];
    for (let i = 0; i < eldAddresses.length; i++) {
        const eldAddress = eldAddresses[i];

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 20,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: null,
                args: ["--force-device-scale-factor=0.5"],
            }
        });

        await cluster.task(async ({ page, data: url }) => {

            //Prevent from loading images, styles and fonts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });

            //Load cookies
            const cookiesString = await fs.readFile(`${eldAddress}`);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);

            await page.goto(url, { waitUntil: 'domcontentloaded' }); //Go to the search link of the first product

            //Extract the title name of the product and its price
            try {
                const productHandles = await page.$$('.store__body__dynamic-content');
                for (const productHandle of productHandles) {
                    const locationHandles = await page.waitForXPath('//*[@id="user-address"]');
                    location = await page.evaluate
                        (el => el.querySelector('#user-address > div > div')
                            .textContent, locationHandles)

                    title = await page.evaluate
                        (el => el.querySelector('.product-row__content > div > div.product-row__name')
                            .textContent, productHandle)

                    price = await page.evaluate
                        (el => el.querySelector('.product-price__effective.product-price__effective--new-card')
                            .textContent, productHandle)

                    product.push({ "city": "ELD", "address": location, "title": title, "price": price })
                    //console.log({ "city": "ELD", "address": location, "title": title, "price": price })
                }
            } catch (error) {
                product.push({ "city": "ELD", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
                //console.log({ "city": "ELD", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
            }

            //await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.close();

        });

        cluster.queue('https://glovoapp.com/ke/en/eldoret/kfc-eld/?search=Rice Bliss');
        cluster.queue('https://glovoapp.com/ke/en/eldoret/kfc-eld/?search=Streetwise 2');
        cluster.queue('https://glovoapp.com/ke/en/eldoret/kfc-eld/?search=Streetwise 3');
        cluster.queue('https://glovoapp.com/ke/en/eldoret/kfc-eld/?search=Streetwise 5');
        cluster.queue('https://glovoapp.com/ke/en/eldoret/kfc-eld/?search=Streetwise 7');
        cluster.queue('https://glovoapp.com/ke/en/eldoret/kfc-eld/?search=KFC Krusher');
        cluster.queue('https://glovoapp.com/ke/en/eldoret/kfc-eld/?search=Double Crunch Burger');

        // List of product search pages

        await cluster.idle();
        await cluster.close();
    }

    //Kisumu Addresses
    let ksmAddresses = ["./kenya/ksm/kisumu.json"];
    for (let i = 0; i < ksmAddresses.length; i++) {
        const ksmAddress = ksmAddresses[i];

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 20,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: null,
                args: ["--force-device-scale-factor=0.5"],
            }
        });

        await cluster.task(async ({ page, data: url }) => {

            //Prevent from loading images, styles and fonts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });

            //Load cookies
            const cookiesString = await fs.readFile(`${ksmAddress}`);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);

            await page.goto(url, { waitUntil: 'domcontentloaded' }); //Go to the search link of the first product

            //Extract the title name of the product and its price
            try {
                const productHandles = await page.$$('.store__body__dynamic-content');
                for (const productHandle of productHandles) {
                    const locationHandles = await page.waitForXPath('//*[@id="user-address"]');
                    location = await page.evaluate
                        (el => el.querySelector('#user-address > div > div')
                            .textContent, locationHandles)

                    title = await page.evaluate
                        (el => el.querySelector('.product-row__content > div > div.product-row__name')
                            .textContent, productHandle)

                    price = await page.evaluate
                        (el => el.querySelector('.product-price__effective.product-price__effective--new-card')
                            .textContent, productHandle)

                    product.push({ "city": "KSM", "address": location, "title": title, "price": price })
                    //console.log({ "city": "KSM", "address": location, "title": title, "price": price })
                }
            } catch (error) {
                product.push({ "city": "KSM", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
                //console.log({ "city": "KSM", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
            }

            //await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.close();

        });

        cluster.queue('https://glovoapp.com/ke/en/kisumu/kfc-ksm/?search=Rice Bliss');
        cluster.queue('https://glovoapp.com/ke/en/kisumu/kfc-ksm/?search=Streetwise 2');
        cluster.queue('https://glovoapp.com/ke/en/kisumu/kfc-ksm/?search=Streetwise 3');
        cluster.queue('https://glovoapp.com/ke/en/kisumu/kfc-ksm/?search=Streetwise 5');
        cluster.queue('https://glovoapp.com/ke/en/kisumu/kfc-ksm/?search=Streetwise 7');
        cluster.queue('https://glovoapp.com/ke/en/kisumu/kfc-ksm/?search=KFC Krusher');
        cluster.queue('https://glovoapp.com/ke/en/kisumu/kfc-ksm/?search=Double Crunch Burger');

        // List of product search pages

        await cluster.idle();
        await cluster.close();
    }

    //Thika Addresses
    let thkAddresses = ["./kenya/thk/thika.json"];
    for (let i = 0; i < thkAddresses.length; i++) {
        const thkAddress = thkAddresses[i];

        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 20,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: null,
                args: ["--force-device-scale-factor=0.5"],
            }
        });

        await cluster.task(async ({ page, data: url }) => {

            //Prevent from loading images, styles and fonts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });

            //Load cookies
            const cookiesString = await fs.readFile(`${thkAddress}`);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);

            await page.goto(url, { waitUntil: 'domcontentloaded' }); //Go to the search link of the first product

            //Extract the title name of the product and its price
            try {
                const productHandles = await page.$$('.store__body__dynamic-content');
                for (const productHandle of productHandles) {
                    const locationHandles = await page.waitForXPath('//*[@id="user-address"]');
                    location = await page.evaluate
                        (el => el.querySelector('#user-address > div > div')
                            .textContent, locationHandles)

                    title = await page.evaluate
                        (el => el.querySelector('.product-row__content > div > div.product-row__name')
                            .textContent, productHandle)

                    price = await page.evaluate
                        (el => el.querySelector('.product-price__effective.product-price__effective--new-card')
                            .textContent, productHandle)

                    product.push({ "city": "THK", "address": location, "title": title, "price": price })
                    //console.log({ "city": "THK", "address": location, "title": title, "price": price })
                }
            } catch (error) {
                product.push({ "city": "THK", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
                //console.log({ "city": "THK", "address": location, "title": url.split("=").pop() + ' Missing', "price": '-' });
            }

            //await page.waitForNavigation({ waitUntil: 'networkidle0' });

            await page.close();

        });

        cluster.queue('https://glovoapp.com/ke/en/thika/kfc-thika-thk/?search=Rice Bliss');
        cluster.queue('https://glovoapp.com/ke/en/thika/kfc-thika-thk/?search=Streetwise 2');
        cluster.queue('https://glovoapp.com/ke/en/thika/kfc-thika-thk/?search=Streetwise 3');
        cluster.queue('https://glovoapp.com/ke/en/thika/kfc-thika-thk/?search=Streetwise 5');
        cluster.queue('https://glovoapp.com/ke/en/thika/kfc-thika-thk/?search=Streetwise 7');
        cluster.queue('https://glovoapp.com/ke/en/thika/kfc-thika-thk/?search=KFC Krusher');
        cluster.queue('https://glovoapp.com/ke/en/thika/kfc-thika-thk/?search=Double Crunch Burger');

        // List of product search pages

        await cluster.idle();
        await cluster.close();
    }
    
    //Current time
    const date = Date()
    const easternTime = date.toLocaleString("en-US", { timeZone: "Africa/Nairobi", timeStyle: "short" });
    time.push(easternTime)
    //console.log(easternTime)

})();

app.get('/stores', function (req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.send(stores);
})

app.get('/kfc', function (req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.send(product);
})

app.get('/time', function (req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.send(time);
})

app.listen(process.env.PORT || 5000, () => console.log(`Listening on port!`))
