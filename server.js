const axios = require('axios');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const scrapeChat = require('./utils/chatScraper'); 
const { sendMessage } = require('./utils/sendMessages'); 
const { enableTranscription } = require('./utils/enableTranscription'); 
const { connectMeatup } = require('./utils/connectMeatup'); 

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Хранилище для сессий
const sessions = {};

// GET метод для вызова /start-session с meetingUrl
app.get('/start-session-from-url', async (req, res) => {
  const meetingUrl = req.query.meetingUrl || 'https://jazz.sberbank.ru/sber-2hd5e8?psw=OBcIHBseDhEdBw8KRAoZAhINEg'; // URL по умолчанию

  // Проверяем, есть ли уже сессия для этого meetingUrl
  const existingSession = Object.entries(sessions).find(([id, session]) => session.meetingUrl === meetingUrl);

  if (existingSession) {
    // Если сессия уже существует, возвращаем её ID
    const [sessionId] = existingSession;
    return res.json({ sessionId, message: 'Существующая сессия найдена' });
  }

  try {
    // Если сессии нет, создаем новую сессию через маршрут /start-session
    const response = await axios.post('http://localhost:5000/start-session', { meetingUrl });

    const { sessionId } = response.data;

    console.log('Создана новая сессия:', sessionId, 'Сессии после создания:', sessions);

    res.json({ sessionId, message: 'Новая сессия создана' });
  } catch (error) {
    console.error('Ошибка при создании сессии:', error.message);
    res.status(500).send('Ошибка при создании сессии');
  }
});

// POST метод для инициализации входа и создания сессии
app.post('/start-session', async (req, res) => {
  const { meetingUrl } = req.body;

  let page;
  const sessionId = Date.now(); // Уникальный ID сессии на основе времени

  try {
    // Подключаемся ко встрече и получаем страницу (connectMeatup - предположительно асинхронная функция)
    page = await connectMeatup(meetingUrl); 
    
    // Проверяем, если ли страница и корректна ли она
    if (!page || typeof page !== 'object') {
      console.error('Ошибка: некорректная страница', page);
      return res.status(500).send('Ошибка создания страницы встречи');
    }

    // Сохраняем как объект с both page и meetingUrl
    sessions[sessionId] = { page, meetingUrl }; 
    console.log(`Сессия ${sessionId} создана.`);
    console.log('Сессии после создания:', sessions); // Лог всех сессий

    // Перед запуском polling, убедитесь, что сессия существует
    if (sessions[sessionId]) {
      console.log('Запуск прослушки ', sessionId);
      startPolling(sessionId); // Запуск polling после создания сессии
    }

    // Возвращаем ID сессии
    res.json({ sessionId });
  } catch (error) {
    console.error('Ошибка при создании сессии:', error);
    res.status(500).send('Ошибка создания сессии');
  }
});

// Маршрут для получения истории чата по ID сессии
app.get('/history/:sessionId', async (req, res) => {
  const sessionIdStr = String(req.params.sessionId); // Преобразуем в строку
  const session = sessions[sessionIdStr];

  // Выводим информацию о сессии
  if (!session || !session.page) {
    console.log('Сессия не найдена или страница некорректна:', sessionIdStr);
    console.log('Состояние сессии:', session); // Логируем текущее состояние сессии для диагностики
    return res.status(404).send('Сессия не найдена');
  }

  try {
    const messages = await scrapeChat(session.page, sessionIdStr); // Получаем сообщения
    res.json({ messages });
  } catch (error) {
    console.error('Ошибка при получении истории чата:', error);
    res.status(500).send('Ошибка получения истории чата');
  }
});

// POST метод для отправки сообщения
app.post('/send-message', async (req, res) => {
  const { sessionId, message } = req.body;

  const session = sessions[String(sessionId)];
  if (!session || !session.page) {
    console.log('Сессия не найдена при отправке сообщения:', sessionId);
    return res.status(404).send('Сессия не найдена');
  }

  try {
    // Отправляем сообщение
    await sendMessage(session.page, message); 
    res.json({ message: 'Сообщение отправлено.' });
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).send('Ошибка при отправке сообщения');
  }
});

// Функция для циклического запроса истории, отправки резюме и вызова scrum-master каждые 60 секунд
async function startPolling(sessionId) {
  const sessionIdStr = String(sessionId); // Преобразуем в строку

  setInterval(async () => {
    try {
      // Проверяем, существует ли сессия перед каждым запросом
      if (!sessions[sessionIdStr] || !sessions[sessionIdStr].page) {
        console.error('Сессия не найдена для polling:', sessionIdStr);
        return;
      }

      console.log('Запрос истории для сессии:', sessionIdStr);

      // 1. Запрашиваем историю сообщений с /history/:sessionId
      const historyResponse = await axios.get(`http://localhost:5000/history/${sessionIdStr}`);
      const history = historyResponse.data.messages;

      // 2. Отправляем историю в /summary/ для получения краткого резюме
      const summaryResponse = await axios.post('http://127.0.0.1:8000/summary/', {
        messages: history
      });

      const summary = summaryResponse.data.summary;

      // Логируем полученное резюме
      console.log('Получено резюме \n:', summary);

      // 3. Вызываем эндпоинт scrum-master для получения сообщения
      const scrumMasterResponse = await axios.post('http://127.0.0.1:8000/scrum-master/', {
        messages: history
      });

      const scrumMasterMessage = scrumMasterResponse.data.decision;

      console.log("Ответ скрам мастера",scrumMasterMessage)

      // Проверяем ответ scrum-master и если он не 'w8', отправляем сообщение
      if (scrumMasterMessage !== 'w8' || scrumMasterMessage === undefined) { 
        await axios.post('http://localhost:5000/send-message', {
          sessionId: sessionIdStr, // Обязательно передаем как строку
          message: scrumMasterMessage
        });

        console.log('Сообщение от scrum-master отправлено:', scrumMasterMessage);
      } else {

        console.log('Ответ от scrum-master: "w8", сообщение не отправлено');
      }

    } catch (error) {
      console.error('Ошибка при запросе и отправке данных:', error.message);
    }
  }, 20000); // Интервал 20 секунд
}

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
