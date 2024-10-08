const puppeteer = require('puppeteer');
const axios = require('axios'); // Убедитесь, что axios установлен

// Функция для парсинга чата через Puppeteer
async function scrapeChat(meetingUrl) {
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

  // Функция для получения сообщений
  const getMessages = async (currentPage) => {
    await currentPage.click('[data-testid="chat"]');
    console.log('Нажали на кнопку "Чат"');

    // Ожидаем загрузки области сообщений
    try {
      await currentPage.waitForSelector('[data-testid="chatRoot"]', { timeout: 60000 });
    } catch (error) {
      console.error('Ошибка при ожидании элемента chatRoot:', error);
      await currentPage.screenshot({ path: 'error_screenshot.png' }); // Делаем скриншот для анализа
      await browser.close();
      return;
    }

    // Переключаем контекст страницы на всю страницу браузера
    await currentPage.bringToFront();

    // Проверяем, есть ли сообщения
    const messagesExist = await currentPage.evaluate(() => {
      const msgsArea = document.querySelector('[data-testid="msgsArea"]');
      return msgsArea && msgsArea.children.length > 0; // Проверяем наличие сообщений
    });

    if (!messagesExist) {
      console.log('Сообщений нет');
      // Отправляем сообщение на бэк
      await axios.post('http://localhost:5000/parse-chat', { messages: 'Сообщений нет' });
      return 'Сообщений нет';
    }

    // Если сообщения есть, получаем их
    const messages = await currentPage.evaluate(() => {
      const messageElements = Array.from(document.querySelectorAll('[data-testid="messageContainer"]'));
      return messageElements.map(message => ({
        sender: message.querySelector('[data-testid="messageUserName"]').innerText,
        content: message.querySelector('[data-testid="messageContent"] .HighlightedText__Container-sc-1g9o0nl-0').innerText,
        timestamp: message.querySelector('[data-testid="time"]').innerText,
      }));
    });

    return messages; // Возвращаем сообщения
  };

  // Функция для проверки участников
  const checkParticipants = async (currentPage) => {
    // Нажимаем на кнопку "Участники"
    await currentPage.waitForSelector('[data-testid="participants"]');
    await currentPage.click('[data-testid="participants"]');
    console.log('Нажали на кнопку "Участники"');

    // Ждем загрузки списка участников
    await currentPage.waitForSelector('[data-testid="participantsListRoot"]');

    const participants = await currentPage.evaluate(() => {
      // Получаем список участников из контейнера
      const participantElements = Array.from(document.querySelectorAll('[data-testid^="participantItem-"]'));
      return participantElements.map(participant => {
        return participant.querySelector('[class*="ParticipantItem__StyledParticipantName"]').innerText; // Селектор с содержанием класса
      });
    });

    console.log(`Участники: ${participants}`);

    // Проверяем, что в списке только "СекретAIрь (вы)"
    const isOnlySecretAI = participants.length === 1 && participants[0] === 'СекретAIрь (вы)';

    if (isOnlySecretAI) {
      console.log('СекретAIрь остался один, получаем сообщения...');
      const messages = await getMessages(currentPage); // Передаем текущую страницу в функцию получения сообщений
      console.log('Полученные сообщения:', messages); // Логируем полученные сообщения

      // Отправка сообщений на бэк, если они есть
      if (messages !== 'Сообщений нет') {
        await axios.post('http://localhost:5000/parse-chat', { messages });
      }

      await browser.close();
      return messages; // Возвращаем сообщения, если нужно
    } else {
      console.log('Участники есть, продолжаем ожидание...');
    }
  };

  // Проверка участников в бесконечном цикле
  while (true) {
    await checkParticipants(page); // Передаем страницу в функцию проверки участников
    await new Promise(resolve => setTimeout(resolve, 5000)); // Проверяем каждые 5 секунд
  }
}

// Экспортируем функцию
module.exports = scrapeChat;
