const puppeteer = require('puppeteer');
const axios = require('axios'); // Убедитесь, что axios установлен

// Функция для парсинга чата через Puppeteer
async function scrapeChat(meetingUrl, startTime, endTime) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--ignore-certificate-errors'] // Игнорируем ошибки сертификатов (для тестирования)
  });
  const page = await browser.newPage();

  console.log('Переход на URL:', meetingUrl);

  // Переходим на страницу встречи
  try {
    await page.goto(meetingUrl, { waitUntil: 'networkidle0' });
  } catch (error) {
    console.error('Ошибка при переходе на URL:', error);
    await browser.close();
    return;
  }

  await page.waitForSelector('[data-testid="continueInBrowser"]');
  await page.click('[data-testid="continueInBrowser"]');
  console.log('Нажали на кнопку "Продолжить в браузере"');

  await page.waitForSelector('input[name="name"]');
  await page.type('input[name="name"]', 'СекретAIрь');
  console.log('Ввели имя: СекретAIрь');

  // Ожидаем, пока кнопка "joinConf" станет доступной (не disabled)
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="joinConf"]');
    return button && !button.disabled; // Проверяем, что кнопка существует и не отключена
  });

  await page.click('[data-testid="joinConf"]');
  console.log('Нажали на кнопку "Присоединиться к конференции"');

  // Ожидаем загрузку чата
  await page.waitForSelector('[data-testid="chat"]');
  await page.click('[data-testid="chat"]');
  console.log('Нажали на кнопку "Чат"');

  // Добавляем отступ в 15 минут к времени начала
  const startTimeWithOffset = new Date(new Date(startTime).getTime() + 15 * 60000); // Добавляем 15 минут

  // Функция для проверки участников
  const checkParticipants = async () => {
    const participants = await page.evaluate(() => {
      const participants = document.querySelectorAll('[data-testid="participant"]');
      return participants.length; // Возвращаем количество участников
    });

    console.log(`Количество участников: ${participants}`);

    if (participants <= 1) {
      console.log('Участников 1 или меньше, отправляем чат на бэк');
      const messages = await page.evaluate(() => {
        const chatMessages = Array.from(document.querySelectorAll('[data-testid="messageContainer"]'));
        return chatMessages.map(message => ({
          sender: message.querySelector('[data-testid="messageUserName"]').innerText,
          content: message.querySelector('[data-testid="messageContent"] .HighlightedText__Container-sc-1g9o0nl-0').innerText,
          timestamp: message.querySelector('[data-testid="time"]').innerText,
        }));
      });

      // Отправляем данные на бэк
      try {
        await axios.post('http://localhost:5000/parse-chat', { messages });
        console.log('Чат успешно отправлен на бэк');
      } catch (error) {
        console.error('Ошибка при отправке чата на бэк:', error);
      }
    }
  };

  // Запускаем проверку участников каждые 5 минут
  const interval = setInterval(async () => {
    const now = new Date();
    if (now >= new Date(endTime)) {
      clearInterval(interval); // Останавливаем интервал, если время окончания достигнуто
      console.log('Время окончания достигнуто, прекращаем проверку участников.');
      await browser.close();
      return;
    }

    if (now >= startTimeWithOffset) { // Начинаем проверку участников только после 15 минут от начала
      await checkParticipants();
    }
  }, 5 * 60 * 1000); // 5 минут в миллисекундах

  // Ждем до окончания встречи
  while (new Date() < new Date(endTime)) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Ждем 1 секунду
  }

  // Останавливаем интервал после окончания
  clearInterval(interval);
  console.log('Проверка участников завершена, закрываем браузер.');
  await browser.close();
}

// Экспортируем функцию
module.exports = scrapeChat;
