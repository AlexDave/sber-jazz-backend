const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const scrapeChat = require('./utils/chatScraper'); // Импорт функции парсинга
const { sendMessage } = require('./utils/sendMessages'); // Импорт функции отправки сообщений
const { enableTranscription } = require('./utils/enableTranscription'); // Импорт функции включения транскрибации
const { connectMeatup } = require('./utils/connectMeatup'); // Импорт функции подключения
const { getAuthorizationCookie } = require('./utils/getAuthorizationCookie');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Маршрут для парсинга чата
app.post('/scrape-chat', async (req, res) => {
  const { meetingUrl } = req.body; // Извлечение URL

  console.log('Извлечённый URL:', meetingUrl);

  let page;

  try {
    // Подключаемся ко встрече и получаем страницу
    page = await connectMeatup(meetingUrl); // Подключаемся и возвращаем страницу
    console.log('Подключение к встрече успешно.');

    // После подключения запускаем парсинг чата
    const messages = await scrapeChat(page); // Вызов функции с переданной страницей
    res.json({ message: 'Парсинг чата завершен.', messages });
  } catch (error) {
    console.error('Ошибка при парсинге чата:', error);
    res.status(500).send('Ошибка парсинга чата');
  } finally {
    if (page) {
      await page.browser().close(); // Закрываем браузер в любом случае
    }
  }
});

// POST метод для отправки сообщения
app.post('/send-message', async (req, res) => {
  const { meetingUrl, message } = req.body;

  console.log('Извлечённый URL:', meetingUrl);
  console.log('Сообщение:', message);

  let page;

  try {
    // Подключаемся ко встрече и получаем страницу
    page = await connectMeatup(meetingUrl); // Подключаемся и возвращаем страницу
    console.log('Подключение к встрече успешно.');

    // Отправляем сообщение
    await sendMessage(page, message); // Передаем страницу в функцию отправки
    res.json({ message: 'Сообщение отправлено.' });
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).send('Ошибка при отправке сообщения');
  } finally {
    if (page) {
      await page.browser().close(); // Закрываем браузер в любом случае
    }
  }
});

// POST метод для включения транскрибации
app.post('/enable-transcription', async (req, res) => {
  const { meetingUrl } = req.body; // Извлечение URL

  console.log('Извлечённый URL для включения транскрибации:', meetingUrl);

  let page;

  try {
    // Подключаемся ко встрече и получаем страницу
    page = await connectMeatup(meetingUrl); // Подключаемся и возвращаем страницу
    console.log('Подключение к встрече успешно.');

    // Включаем транскрибацию
    await enableTranscription(page);
    res.json({ message: 'Транскрибация включена.' });
  } catch (error) {
    console.error('Ошибка при включении транскрибации:', error);
    res.status(500).send('Ошибка включения транскрибации');
  } finally {
    if (page) {
      await page.browser().close(); // Закрываем браузер в любом случае
    }
  }
});

// Маршрут для получения куки Authorization
app.get('/get-authorization-cookie', async (req, res) => {
  try {
    const authCookie = await getAuthorizationCookie();
    if (authCookie) {
      res.json({ authorization: authCookie });
    } else {
      res.status(404).send('Кука Authorization не найдена.');
    }
  } catch (error) {
    console.error('Ошибка при получении куки Authorization:', error);
    res.status(500).send('Ошибка получения куки Authorization');
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
