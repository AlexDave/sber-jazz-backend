const puppeteer = require('puppeteer');

// Функция для получения куки Authorization
async function getAuthorizationCookie() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--ignore-certificate-errors'] // Игнорируем ошибки сертификатов (для тестирования)
  });

  const page = await browser.newPage();
  
  try {
    // Переход на страницу
    await page.goto('https://jazz.sberbank.ru/', { waitUntil: 'networkidle0' });
    
    // Получаем куки
    const cookies = await page.cookies();
    
    // Находим куку Authorization
    const authorizationCookie = cookies.find(cookie => cookie.name === 'Authorization');

    if (authorizationCookie) {
      console.log('Кука Authorization найдена:', authorizationCookie.value);
      return authorizationCookie.value; // Возвращаем значение куки
    } else {
      console.log('Кука Authorization не найдена.');
      return null; // Если кука не найдена
    }
  } catch (error) {
    console.error('Ошибка при получении куки Authorization:', error);
    return null; // Возвращаем null в случае ошибки
  } finally {
    await browser.close(); // Закрываем браузер
  }
}

// Экспортируем функцию
module.exports = { getAuthorizationCookie };
