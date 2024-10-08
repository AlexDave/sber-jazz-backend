const puppeteer = require('puppeteer');

// Функция для отправки сообщения в чат
async function sendMessage(page, message) {
  // Устанавливаем разрешение страницы
  await page.setViewport({ width: 1080, height: 720 });
  console.log('Установлено разрешение страницы: 1920x1080');

  console.log('Отправка сообщения:', message);

  // Проверяем наличие селектора chatRoot
  const chatRootExists = await page.$('[data-testid="chatRoot"]');
  if (!chatRootExists) {
    // Если селектор chatRoot отсутствует, нажимаем кнопку "Чат"
    await page.click('[data-testid="chat"]');
    console.log('Нажали на кнопку "Чат"');
  } else {
    console.log('Селектор "chatRoot" уже присутствует, пропускаем нажатие кнопки "Чат".');
  }

  
  // Ожидаем загрузки области ввода сообщения
  await page.waitForSelector('[data-testid="msgInput"]'); // Ожидаем поле ввода сообщения
  await page.type('[data-testid="msgInput"]', message); // Вводим сообщение
  console.log(`Введено сообщение: ${message}`);

   // Устанавливаем фокус на текстовое поле
   await page.focus('[data-testid="msgInput"]');
   
  // Нажимаем клавишу Enter для отправки сообщения
  await page.keyboard.press('Enter');
  console.log('Сообщение отправлено с помощью клавиши Enter.');
}

// Утилиты для нажатия кнопки и других действий остаются без изменений
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
module.exports = { sendMessage };
