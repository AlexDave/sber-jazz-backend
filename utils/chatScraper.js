const puppeteer = require('puppeteer');
const axios = require('axios'); // Убедитесь, что axios установлен

// Функция для парсинга чата через Puppeteer
async function scrapeChat(page) {
  // Устанавливаем разрешение страницы
  await page.setViewport({ width: 1920, height: 1080 });
  console.log('Установлено разрешение страницы: 1920x1080');

  // Ожидаем загрузку чата
  try {
    await page.waitForSelector('[data-testid="chat"]');
    await page.screenshot({ path: 'chat_page_screenshot.png' }); // Скриншот страницы после загрузки чата
  } catch (error) {
    console.error('Ошибка при ожидании чата:', error);
    await page.screenshot({ path: 'error_screenshot_chat.png' });
    throw new Error('Ошибка при ожидании чата');
  }

  // Функция для получения сообщений
  const getMessages = async (currentPage) => {
    try {
      await currentPage.click('[data-testid="chat"]');
      console.log('Нажали на кнопку "Чат"');

      // Ожидаем загрузки области сообщений
      await currentPage.waitForSelector('[data-testid="chatRoot"]', { timeout: 30000 });

      // Переключаем контекст страницы на всю страницу браузера
      await currentPage.bringToFront();

      // Проверяем, есть ли сообщения
      const messagesExist = await currentPage.evaluate(() => {
        const msgsArea = document.querySelector('[data-testid="msgsArea"]');
        return msgsArea && msgsArea.children.length > 0; // Проверяем наличие сообщений
      });

      if (!messagesExist) {
        console.log('Сообщений нет');
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
    } catch (error) {
      console.error('Ошибка при получении сообщений:', error);
      await currentPage.screenshot({ path: 'error_screenshot_get_messages.png' });
      return [];
    }
  };

  // Функция для проверки участников
  const checkParticipants = async (currentPage) => {
    try {
      // Проверяем, существует ли список участников
      const participantsListExists = await currentPage.$('[data-testid="participantsListRoot"]');
      if (!participantsListExists) {
        // Нажимаем на кнопку "Участники", только если список еще не загружен
        await currentPage.waitForSelector('[data-testid="participants"]');
        await currentPage.click('[data-testid="participants"]');
        console.log('Нажали на кнопку "Участники"');
      } else {
        console.log('Список участников уже загружен, пропускаем нажатие кнопки.');
      }

      // Ждем загрузки списка участников
      await currentPage.waitForSelector('[data-testid="participantsListRoot"]');
      await currentPage.screenshot({ path: 'participants_list_screenshot.png' }); // Скриншот после загрузки участников

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
        const messages = await getMessages(page); // Передаем текущую страницу в функцию получения сообщений
        console.log('Полученные сообщения:', messages); // Логируем полученные сообщения

        return messages; // Возвращаем сообщения, если нужно
      } else {
        console.log('Участники есть, продолжаем ожидание...');
      }
    } catch (error) {
      console.error('Ошибка при проверке участников:', error);
      await currentPage.screenshot({ path: 'error_screenshot_check_participants.png' });
    }
  };

  // Проверка участников в бесконечном цикле
  while (true) {
    const result = await checkParticipants(page); // Передаем страницу в функцию проверки участников
    if (result) {
      return result; // Выход из цикла, если были получены сообщения
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // Проверяем каждые 5 секунд
  }
}

// Экспортируем функцию
module.exports = scrapeChat;
