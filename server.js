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

// Маршрут для инициализации входа и создания сессии
app.post('/start-session', async (req, res) => {
  const { meetingUrl } = req.body; 

  let page;
  const sessionId = Date.now(); // Уникальный ID сессии на основе времени

  try {
    // Подключаемся ко встрече и получаем страницу
    page = await connectMeatup(meetingUrl); 
    sessions[sessionId] = { page }; // Сохраняем страницу в сессии
    console.log(`Сессия ${sessionId} создана.`);
    res.json({ sessionId }); // Возвращаем ID сессии
  } catch (error) {
    console.error('Ошибка при создании сессии:', error);
    res.status(500).send('Ошибка создания сессии');
  }
});

// Маршрут для получения истории чата по ID сессии
app.get('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  const session = sessions[sessionId];
  if (!session || !session.page) {
    return res.status(404).send('Сессия не найдена');
  }

  try {
    const messages = await scrapeChat(session.page, sessionId); // Получаем сообщения
    res.json({ messages });
  } catch (error) {
    console.error('Ошибка при получении истории чата:', error);
    res.status(500).send('Ошибка получения истории чата');
  }
});


// POST метод для отправки сообщения
app.post('/send-message', async (req, res) => {
  const { sessionId, message } = req.body;

  const session = sessions[sessionId];
  if (!session || !session.page) {
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

// POST метод для включения транскрибации
app.post('/enable-transcription', async (req, res) => {
  const { sessionId } = req.body; 

  const session = sessions[sessionId];
  if (!session || !session.page) {
    return res.status(404).send('Сессия не найдена');
  }

  try {
    // Включаем транскрибацию
    await enableTranscription(session.page); 
    res.json({ message: 'Транскрибация включена.' });
  } catch (error) {
    console.error('Ошибка при включении транскрибации:', error);
    res.status(500).send('Ошибка включения транскрибации');
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
