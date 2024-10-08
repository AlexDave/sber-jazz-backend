const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const scrapeChat = require('./utils/chatScraper'); // Импорт функции

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Маршрут для парсинга чата
app.post('/scrape-chat', async (req, res) => {
  const { meetingUrl, startTime, endTime } = req.body; // Извлечение URL и временных рамок

  console.log('Извлечённый URL:', meetingUrl);
  console.log('Начало встречи:', startTime);
  console.log('Окончание встречи:', endTime);

  try {
    await scrapeChat(meetingUrl, startTime, endTime); // Вызов функции с переданными параметрами
    res.send('Парсинг чата запущен.');
  } catch (error) {
    console.error('Ошибка при парсинге чата:', error);
    res.status(500).send('Ошибка парсинга чата');
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
