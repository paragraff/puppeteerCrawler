(async() => {
  const puppeteer = require("puppeteer-extra")
  const env = require('./env.json')

  const pluginStealth = require("puppeteer-extra-plugin-stealth")
  puppeteer.use(pluginStealth())

  const browser = await puppeteer.launch({
    headless: true,
    // если нужно запустить кастомній браузер
    // executablePath: env.pathToBrowser,
    args: [/*`--user-data-dir=${env.pathToBrowserUserData}`,*/ /*'--auto-open-devtools-for-tabs',*/ '--no-sandbox']
  });

  const page = await browser.newPage()
  // маскируемся под обічній экран
  await page.setViewport({
    width: 1920,
    height: 946,
    deviceScaleFactor: 2,
  })

  const pageURL = env.urlToCrowl

  await page.setRequestInterception(true)
  page.on('request', async request => {
    if (request.url() === env.validationRequestUrl) {
        // пока здесь токен, ответ не будет меняться. Время обновления токена указано в свойстве renewInSec ответа
        // когда здесь json - это собранніе параметрі браузера. Их нужно эмулировать для прохождения валидации
        // puppeteer-extra-plugin-stealth как раз их эмулирует
        // теоретически можно было бы подменять запрос на токен с реального браузера, но есть вероятность,
        // что токен содержит данные браузера и при валидации это проверяется. Не экспериментировал
        console.log('Запрос: ' + request.postData())
    }
    request.continue()
  })

  page.on('response', async response => {
    // отслеживаем ожидаемій ответ
    if (response.url() === env.validationRequestUrl) {
      const text = await response.text()
      // ответ на валидационній запрос
      console.log('Ответ: ' + text)
    }
  })

  try {
    await page.goto(pageURL, {waitUntil: 'load'})
    console.log(`Открываю страницу: ${pageURL}`)
    await page.waitFor(5000)

    await page.screenshot({path: 'result.png'})
    // вот тут можно собирать данные
    console.log('do something')
  } catch (error) {
    console.log(`Не удалось открыть страницу: ${pageURL} из-за ошибки: ${error.message}`)
  }
  await browser.close()

  process.exit()
})();