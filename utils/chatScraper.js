const puppeteer = require('puppeteer');

// Функция для парсинга чата
async function scrapeChat(page, sessionId) {

  let messages = [];
  console.log('Начинаем парсинг чата...');

  // Ожидаем, пока чат станет доступен
  await page.waitForSelector('[data-testid="chat"]');

  // Проверяем наличие элемента chatRoot
  const chatRootExists = await page.$('[data-testid="chatRoot"]');

  if (!chatRootExists) {
    // Если chatRoot отсутствует, нажимаем кнопку "Чат"
    await page.click('[data-testid="chat"]');
    console.log('Нажали на кнопку "Чат", так как chatRoot не найден.');

    // Ждем, пока chatRoot станет доступен после нажатия
    await page.waitForSelector('[data-testid="chatRoot"]');
  } else {
    console.log('Селектор "chatRoot" уже присутствует, продолжаем парсинг.');
  }

  // Получаем сообщения из чата
  messages = await page.evaluate(() => {
    const messageElements = Array.from(document.querySelectorAll('[data-testid="messageContainer"]'));
    return messageElements.map(message => ({
      sender: message.querySelector('[data-testid="messageUserName"]').innerText,
      content: message.querySelector('[data-testid="messageContent"] .HighlightedText__Container-sc-1g9o0nl-0').innerText,
      timestamp: message.querySelector('[data-testid="time"]').innerText,
    }));
  });

  // Проверяем участников
  const participantsChecked = await checkParticipants(page, sessionId);
  
  // Если нужно, можно добавить дополнительную логику здесь
  if (participantsChecked) {
    console.log('Участники проверены, возвращаем сообщения.');
  } else {
    console.log('Участники не соответствуют условиям, финализируем встречу.');
    await finalizeMeeting(sessionId, messages); // Финализируем встречу
    await page.close(); // Закрываем текущую страницу
  }

  console.log('Парсинг чата завершен.');
  return messages; // Возвращаем сообщения
}

// Функция для проверки участников
async function checkParticipants(currentPage, messages) {
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

    // Проверяем, что в списке 1 или меньше участников
    const participantCount = participants.length;

    if (participantCount <= 1) {
      console.log(`Количество участников: ${participantCount}.`);
      return false; // Вернем false, если участников 1 или меньше
    }

    return true; // Если участников больше 1, возвращаем true
  } catch (error) {
    console.error('Ошибка при проверке участников:', error);
    await currentPage.screenshot({ path: 'error_screenshot_check_participants.png' });
    return false; // В случае ошибки возвращаем false
  }
}

// Функция для финализации встречи
async function finalizeMeeting(sessionId, messages) {
  console.log(`Финализируем встречу для сессии ${sessionId}...`);

  console.log(`Финализируем встречу для сессии ${sessionId}...`);

  // Добавляем последнее сообщение в массив сообщений
  const finalMessage = {
    sender: 'final_speaker',
    content: 'Встреча завершена.',
    timestamp: new Date().toLocaleTimeString(), // Временная метка текущего времени
  };

  messages.push(finalMessage); // Добавляем сообщение о завершении встречи в массив

  console.log(`Встреча для сессии ${sessionId} успешно финализирована.`);
}

// Экспортируем функцию
module.exports = scrapeChat;
