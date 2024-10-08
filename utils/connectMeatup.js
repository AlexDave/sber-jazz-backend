const puppeteer = require('puppeteer');

// Функция для подключения к чату
async function connectMeatup(meetingUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--ignore-certificate-errors'] // Игнорируем ошибки сертификатов (для тестирования)
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  console.log('Установлено разрешение страницы: 1920x1080');
  console.log('Переход на URL:', meetingUrl);

  // Переход на страницу встречи
  try {
    await page.goto(meetingUrl, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'initial_page_screenshot.png' });
  } catch (error) {
    console.error('Ошибка при переходе на URL:', error);
    await page.screenshot({ path: 'error_screenshot_goto.png' });
    await browser.close();
    throw new Error('Ошибка при переходе на URL');
  }

  // Нажимаем "Продолжить в браузере"
  await clickButton(page, '[data-testid="continueInBrowser"]', 'Нажали на кнопку "Продолжить в браузере"');

  // Вводим имя
  await typeInput(page, 'input[name="name"]', 'СекретAIрь', 'Ввели имя: СекретAIрь');

  // Присоединяемся к конференции
  await waitAndClick(page, '[data-testid="joinConf"]', 'Нажали на кнопку "Присоединиться к конференции"');

  // Ожидаем загрузку чата
  await waitForSelector(page, '[data-testid="chat"]', 'Ошибка при ожидании чата', 'chat_page_screenshot.png');

  return page; // Возвращаем объект page для дальнейшего использования
}

// Утилиты для нажатия кнопки и других действий
async function clickButton(page, selector, logMessage) {
  try {
    await page.waitForSelector(selector);
    await page.click(selector);
    console.log(logMessage);
  } catch (error) {
    console.error(`Ошибка при нажатии на кнопку ${selector}:`, error);
    await page.screenshot({ path: `error_screenshot_${selector}.png` });
  }
}

async function typeInput(page, selector, text, logMessage) {
  try {
    await page.waitForSelector(selector);
    await page.type(selector, text);
    console.log(logMessage);
  } catch (error) {
    console.error(`Ошибка при вводе текста в ${selector}:`, error);
    await page.screenshot({ path: `error_screenshot_input_${selector}.png` });
  }
}

async function waitAndClick(page, selector, logMessage) {
  try {
    await page.waitForFunction(() => {
      const button = document.querySelector(selector);
      return button && !button.disabled;
    });
    await page.click(selector);
    console.log(logMessage);
  } catch (error) {
    console.error(`Ошибка при ожидании кнопки ${selector}:`, error);
    await page.screenshot({ path: `error_screenshot_${selector}.png` });
  }
}

async function waitForSelector(page, selector, errorMessage, screenshotPath) {
  try {
    await page.waitForSelector(selector);
    await page.screenshot({ path: screenshotPath });
  } catch (error) {
    console.error(errorMessage, error);
    await page.screenshot({ path: screenshotPath });
    await page.close();
    throw new Error(errorMessage);
  }
}

// Экспортируем функцию
module.exports = { connectMeatup };
