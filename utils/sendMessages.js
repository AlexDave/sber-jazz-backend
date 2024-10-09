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

// Экспортируем функцию
module.exports = { sendMessage };
