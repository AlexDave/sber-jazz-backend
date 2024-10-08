# Chat Scraper for SberJazz

![Project Logo](link-to-your-logo.png)

## Описание

Этот проект представляет собой инструмент для парсинга сообщений из чата видеоконференций на платформе SberJazz. Используя Puppeteer, приложение может автоматически входить в конференцию, получать сообщения чата и отправлять их на сервер для дальнейшей обработки.

## Функции

- Автоматический вход в видеоконференцию по заданному URL.
- Получение сообщений из чата в реальном времени.
- Отправка полученных сообщений на указанный сервер.
- Возможность работы с участниками конференции.

## Установка

### Требования

- Node.js (версии 14 и выше)
- npm (Node Package Manager)

### Шаги установки

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/yourusername/chat-scraper.git
   cd chat-scraper
   ```

2. Установите зависимости:

    ```bash
    npm install
    ```

Настройте ваш сервер для обработки полученных сообщений (например, на http://localhost:5000/parse-chat).

Использование
Для запуска парсера используйте следующий код:

    ```js
    const scrapeChat = require('./utils/chatScraper');

    const meetingUrl = 'your-meeting-url';
    scrapeChat(meetingUrl)
    .then(messages => {
        console.log('Полученные сообщения:', messages);
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
    ```

# Связь

Если у вас возникли вопросы, вы можете связаться со мной по электронной почте: your-email@example.com.