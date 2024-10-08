const puppeteer = require('puppeteer');

// Функция для включения транскрибации
async function enableTranscription(page) {
  // Устанавливаем разрешение страницы
  await page.setViewport({ width: 1920, height: 1080 });
  console.log('Установлено разрешение страницы: 1920x1080');

  // Ожидаем кнопку для включения транскрибации
  await page.waitForSelector('[data-testid="transcriptionToggle"]'); // Замените селектор на актуальный
  const isTranscriptionEnabled = await page.$eval('[data-testid="transcriptionToggle"]', el => el.checked);

  if (!isTranscriptionEnabled) {
    // Если транскрибация отключена, включаем ее
    await page.click('[data-testid="transcriptionToggle"]');
    console.log('Включена транскрибация.');
  } else {
    console.log('Транскрибация уже включена, пропускаем.');
  }

  // Дополнительные шаги для проверки или ожидания активации транскрибации
  await page.waitForTimeout(1000); // Например, ждем 1 секунду, чтобы убедиться, что транскрибация активирована
}

// Экспортируем функцию
module.exports = { enableTranscription };
