require('dotenv').config(); // Загружает .env
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); // Для работы с файлами

// Вставьте ваш токен от BotFather
const token = process.env.BOT_TOKEN; // Теперь токен берётся из .env

// Создаём бота
const bot = new TelegramBot(token, { polling: true });

// Хранилище предпочтений пользователей (для ИИ)
const userPreferences = {};

// Хранилище состояния пользователей
const userState = {};

// Хранилище записей пользователей
const bookings = {};

// Хранилище отзывов
const reviews = {};

// Хранилище языковых настроек пользователей
const userLanguages = {};

// Доступные языки
const languages = {
    sr: 'Српски', // Сербский
    ru: 'Русский',
    en: 'English'
};

// Тексты на разных языках
const messages = {
    sr: {
        welcome: "✨ Добро дошли у Style Salon! Учинићемо вас још лепшим! 💇‍♀️\nИзаберите шта вам треба:",
        selectService: "Молимо вас, изаберите услугу:",
        selectTime: "Изаберите датум и време:",
        invalidService: "Молимо вас, изаберите услугу са дугмади испод:",
        invalidTime: "Молимо вас, изаберите датум и време са дугмади испод:",
        bookingConfirmed: (service, time) => `Успешно сте резервисали ${service} за ${time}! 🎉\nОвај бот аутоматизује резервације, повећава продају и привлачи клијенте. Желите исти за ваш салон? Пишите @YourUsername!`,
        whatNext: "Шта желите да урадите следеће?",
        addCommentPrompt: "Да ли желите да додате коментар за ову резервацију? (нпр. 'Користите хипоалергену боју') Напишите коментар или притисните 'Прескочи':",
        commentSkipped: "Коментар није додат.",
        priceList: "Ево нашег ценовника:\n{priceList}\n\nИзаберите услугу и резервишите одмах!",
        newPrice: "Нова цена",
        insteadOf: "уместо",
        about: "💇‍♀️ Style Salon\nАдреса: ул. Примерна 10, Београд\nРадно време: 9:00–20:00\nТелефон: +381 123 456 789\nПравимо најбоље фризуре и стилизовање у граду! 💖\n\nОвај бот може повећати вашу продају за 30% кроз аутоматизацију! Желите да сазнате како? Пишите @YourUsername!",
        promos: "{promoText}\n\nПритисните 'Резервиши' да не пропустите попуст!\n\nСалони који користе ботове повећавају продају за 30% и штеде 10 сати недељно на ручном раду!",
        checkBookings: "Ваше резервације:\n{bookings}\n\n(Ово је симулација, у будућности ћемо додати право складиштење резервација.)",
        unknownCommand: "Молимо вас, изаберите акцију са дугмади испод:",
        addAnotherBooking: "Додати још једну резервацију",
        checkMyBookings: "Проверити моје резервације",
        backToMainMenu: "Вратити се на главни мени",
        cancelBooking: "Отказати резервацију",
        contactOwner: "Контактирати власника",
        leaveReview: "Оставити рецензију",
        changeLanguage: "Променити језик",
        skip: "Прескочити",
        contactInfo: "📞 Контактирајте власника:\nТелефон: +381 123 456 789\nЕ-пошта: stylesalon@example.com",
        leaveReviewPrompt: "Молимо вас, оставите рецензију о нашем салону (напишите текст):",
        reviewThanks: "Хвала на рецензији! Желите да оставите рецензију на Google Maps? Посетите: https://maps.google.com/?q=Style+Salon+Belgrade",
        selectLanguage: "Изаберите језик / Изберите язык / Select language:",
        languageChanged: "Језик је промењен на {language}.",
        noAvailableSlots: "Нажалост, нема слободних термина."
    },
    ru: {
        welcome: "✨ Добро пожаловать в Style Salon! Мы сделаем вас ещё красивее! 💇‍♀️\nВыберите, что вам нужно:",
        selectService: "Пожалуйста, выберите услугу:",
        selectTime: "Выберите дату и время:",
        invalidService: "Пожалуйста, выберите услугу из предложенных кнопок:",
        invalidTime: "Пожалуйста, выберите дату и время из предложенных кнопок:",
        bookingConfirmed: (service, time) => `Вы записаны на ${service} на ${time}! 🎉\nЭтот бот автоматизирует запись, увеличивает продажи и привлекает клиентов. Хотите такой же для вашего салона? Напишите @YourUsername для заказа!`,
        whatNext: "Что хотите сделать дальше?",
        addCommentPrompt: "Хотите добавить комментарий к этой записи? (например, 'Используйте гипоаллергенную краску') Напишите комментарий или нажмите 'Пропустить':",
        commentSkipped: "Комментарий не добавлен.",
        priceList: "Вот наш прайс-лист:\n{priceList}\n\nВыберите услугу и запишитесь прямо сейчас!",
        newPrice: "Новая цена",
        insteadOf: "вместо",
        about: "💇‍♀️ Style Salon\nАдрес: ул. Примерная 10, Белград\nЧасы работы: 9:00–20:00\nТелефон: +381 123 456 789\nМы делаем лучшие стрижки и укладки в городе! 💖\n\nЭтот бот может увеличить ваши продажи на 30% за счёт автоматизации! Хотите узнать, как? Напишите @YourUsername!",
        promos: "{promoText}\n\nНажмите 'Записаться', чтобы не упустить скидку!\n\nСалоны, использующие ботов, увеличивают продажи на 30% и экономят 10 часов в неделю на ручной работе!",
        checkBookings: "Ваши записи:\n{bookings}\n\n(Это имитация, в будущем добавим реальное хранение записей.)",
        unknownCommand: "Пожалуйста, выберите действие из меню ниже:",
        addAnotherBooking: "Добавить ещё одну запись",
        checkMyBookings: "Проверить мои записи",
        backToMainMenu: "Вернуться в главное меню",
        cancelBooking: "Отменить запись",
        contactOwner: "Связаться с владельцем",
        leaveReview: "Оставить отзыв",
        changeLanguage: "Сменить язык",
        skip: "Пропустить",
        contactInfo: "📞 Связаться с владельцем:\nТелефон: +381 123 456 789\nЭлектронная почта: stylesalon@example.com",
        leaveReviewPrompt: "Пожалуйста, оставьте отзыв о нашем салоне (напишите текст):",
        reviewThanks: "Спасибо за отзыв! Хотите оставить отзыв на Google Maps? Перейдите по ссылке: https://maps.google.com/?q=Style+Salon+Belgrade",
        selectLanguage: "Изаберите језик / Изберите язык / Select language:",
        languageChanged: "Язык изменён на {language}.",
        noAvailableSlots: "К сожалению, нет свободных слотов."
    },
    en: {
        welcome: "✨ Welcome to Style Salon! We’ll make you even more beautiful! 💇‍♀️\nChoose what you need:",
        selectService: "Please select a service:",
        selectTime: "Select date and time:",
        invalidService: "Please select a service from the buttons below:",
        invalidTime: "Please select a date and time from the buttons below:",
        bookingConfirmed: (service, time) => `You are booked for ${service} on ${time}! 🎉\nThis bot automates bookings, boosts sales, and attracts clients. Want one for your salon? Contact @YourUsername!`,
        whatNext: "What would you like to do next?",
        addCommentPrompt: "Would you like to add a comment to this booking? (e.g., 'Please use hypoallergenic dye') Write your comment or press 'Skip':",
        commentSkipped: "No comment added.",
        priceList: "Here’s our price list:\n{priceList}\n\nSelect a service and book now!",
        newPrice: "New price",
        insteadOf: "instead of",
        about: "💇‍♀️ Style Salon\nAddress: 10 Primer St, Belgrade\nWorking Hours: 9:00–20:00\nPhone: +381 123 456 789\nWe create the best haircuts and styles in town! 💖\n\nThis bot can increase your sales by 30% through automation! Want to learn how? Contact @YourUsername!",
        promos: "{promoText}\n\nPress 'Book' to take advantage of the discount!\n\nSalons using bots increase sales by 30% and save 10 hours a week on manual work!",
        checkBookings: "Your bookings:\n{bookings}\n\n(This is a simulation; we’ll add real booking storage in the future.)",
        unknownCommand: "Please select an action from the menu below:",
        addAnotherBooking: "Add another booking",
        checkMyBookings: "Check my bookings",
        backToMainMenu: "Back to main menu",
        cancelBooking: "Cancel booking",
        contactOwner: "Contact the owner",
        leaveReview: "Leave a review",
        changeLanguage: "Change language",
        skip: "Skip",
        contactInfo: "📞 Contact the owner:\nPhone: +381 123 456 789\nEmail: stylesalon@example.com",
        leaveReviewPrompt: "Please leave a review about our salon (write your text):",
        reviewThanks: "Thank you for your review! Want to leave a review on Google Maps? Visit: https://maps.google.com/?q=Style+Salon+Belgrade",
        selectLanguage: "Изаберите језик / Изберите язык / Select language:",
        languageChanged: "Language changed to {language}.",
        noAvailableSlots: "Sorry, no available slots."
    }
};
// Функция для получения текста на нужном языке
const getMessage = (chatId, key, params = {}) => {
    const lang = userLanguages[chatId] || 'ru'; // По умолчанию русский
    let message = messages[lang][key] || messages.ru[key]; // Если текст не найден, используем русский
    if (typeof message === 'function') {
        return message(...Object.values(params));
    }
    Object.keys(params).forEach(param => {
        message = message.replace(`{${param}}`, params[param]);
    });
    return message;
};

// Функция для логирования с обработкой ошибок
const logMessage = (message) => {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        fs.appendFileSync('bot.log', logEntry);
    } catch (error) {
        console.error(`Не удалось записать в bot.log: ${error.message}`);
    }
};

// Импортируем обработчики
const startHandler = require('./handlers/start');
const bookHandler = require('./handlers/book');
const priceHandler = require('./handlers/price');
const aboutHandler = require('./handlers/about');
const promoHandler = require('./handlers/promo');

// Обработчик входящих сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim(); // Убираем пробелы, сохраняем регистр

    // Логируем входящее сообщение
    console.log(`User ${chatId} sent: ${msg.text}`);
    logMessage(`User ${chatId} sent: ${msg.text}`);

    // Инициализируем состояние пользователя, если его нет
    if (!userState[chatId]) {
        userState[chatId] = { step: 'idle' };
    }

    // Отладочный лог: текущий язык пользователя
    console.log(`Current userLanguages[${chatId}]: ${userLanguages[chatId]}`);

    // Отладочный лог: проверяем значения languages
    console.log(`Available languages: ${JSON.stringify(languages)}`);

    // Обработка выбора языка
    if (Object.values(languages).includes(text)) {
        console.log(`Language selection detected: ${text}`);
        const selectedLang = Object.keys(languages).find(key => languages[key] === text);
        if (selectedLang) {
            userLanguages[chatId] = selectedLang;
            bot.sendMessage(chatId, getMessage(chatId, 'languageChanged', { language: languages[selectedLang] }));
            startHandler(bot, chatId, getMessage);
            logMessage(`User ${chatId} changed language to ${selectedLang}`);
            console.log(`User ${chatId} changed language to ${selectedLang}`);
            return;
        } else {
            console.log(`Error: Could not find language key for ${text}`);
            logMessage(`Error: Could not find language key for ${text}`);
        }
    } else {
        console.log(`Text "${text}" not found in languages: ${Object.values(languages)}`);
    }

    // Если пользователь ещё не выбрал язык, показываем выбор языка
    if (!userLanguages[chatId] && text.toLowerCase() !== '/start') {
        bot.sendMessage(chatId, getMessage(chatId, 'selectLanguage'), {
            reply_markup: {
                keyboard: Object.keys(languages).map(lang => [languages[lang]]),
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        logMessage(`Bot to ${chatId}: Asked to select language`);
        console.log(`Bot to ${chatId}: Asked to select language`);
        return;
    }

    // Если пользователь в процессе записи, не обрабатываем команды из главного меню
    if (userState[chatId].step === 'selecting_service' || userState[chatId].step === 'selecting_time' || userState[chatId].step === 'adding_comment' || userState[chatId].step === 'leaving_review' || userState[chatId].step === 'cancelling') {
        return; // Пропускаем обработку, так как bookHandler или другие обработчики сами разберутся
    }

    // Обработка команд из главного меню
    if (text.toLowerCase() === '/start' || text.toLowerCase() === getMessage(chatId, 'backToMainMenu').toLowerCase()) {
        userState[chatId].step = 'idle';
        if (!userLanguages[chatId]) {
            bot.sendMessage(chatId, getMessage(chatId, 'selectLanguage'), {
                reply_markup: {
                    keyboard: Object.keys(languages).map(lang => [languages[lang]]),
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
            logMessage(`Bot to ${chatId}: Asked to select language`);
            console.log(`Bot to ${chatId}: Asked to select language`);
        } else {
            startHandler(bot, chatId, getMessage);
            logMessage(`Bot replied to ${chatId}: Sent start message`);
            console.log(`Bot replied to ${chatId}: Sent start message`);
        }
    } else if (text.toLowerCase() === 'записаться' || text.toLowerCase() === getMessage(chatId, 'addAnotherBooking').toLowerCase()) {
        userState[chatId].step = 'selecting_service';
        bookHandler(bot, chatId, userPreferences, userState, bookings, getMessage, userLanguages);
        logMessage(`Bot replied to ${chatId}: Started booking process`);
        console.log(`Bot replied to ${chatId}: Started booking process`);
    } else if (text.toLowerCase() === 'прайс') {
        userState[chatId].step = 'idle';
        priceHandler(bot, chatId, getMessage, userLanguages);
        logMessage(`Bot replied to ${chatId}: Sent price list`);
        console.log(`Bot replied to ${chatId}: Sent price list`);
    } else if (text.toLowerCase() === 'о салоне') {
        userState[chatId].step = 'idle';
        aboutHandler(bot, chatId, getMessage);
        logMessage(`Bot replied to ${chatId}: Sent about info`);
        console.log(`Bot replied to ${chatId}: Sent about info`);
    } else if (text.toLowerCase() === 'акции') {
        userState[chatId].step = 'idle';
        promoHandler(bot, chatId, getMessage, userLanguages);
        logMessage(`Bot replied to ${chatId}: Sent promo info`);
        console.log(`Bot replied to ${chatId}: Sent promo info`);
    } else if (text.toLowerCase() === getMessage(chatId, 'checkMyBookings').toLowerCase()) {
        userState[chatId].step = 'idle';
        const userBookings = bookings[chatId] || [];
        const bookingList = userBookings.length > 0
            ? userBookings.map((b, index) => `${index + 1}. ${b.service}, ${b.time}${b.comment ? ` (Комментарий: ${b.comment})` : ''}`).join('\n')
            : 'У вас нет активных записей.';
        bot.sendMessage(chatId, getMessage(chatId, 'checkBookings', { bookings: bookingList }), {
            reply_markup: {
                keyboard: [
                    [getMessage(chatId, 'addAnotherBooking')],
                    [getMessage(chatId, 'checkMyBookings')],
                    userBookings.length > 0 ? [getMessage(chatId, 'cancelBooking')] : [],
                    [getMessage(chatId, 'backToMainMenu')],
                    [getMessage(chatId, 'contactOwner')],
                    [getMessage(chatId, 'leaveReview')],
                    [getMessage(chatId, 'changeLanguage')]
                ].filter(row => row.length > 0),
                resize_keyboard: true
            }
        });
        logMessage(`Bot replied to ${chatId}: Sent booking list`);
        console.log(`Bot replied to ${chatId}: Sent booking list`);
    }
    else if (text.toLowerCase() === getMessage(chatId, 'cancelBooking').toLowerCase()) {
        const userBookings = bookings[chatId] || [];
        if (userBookings.length === 0) {
            bot.sendMessage(chatId, getMessage(chatId, 'checkBookings', { bookings: 'У вас нет активных записей.' }));
            logMessage(`Bot to ${chatId}: No bookings to cancel`);
            console.log(`Bot to ${chatId}: No bookings to cancel`);
            return;
        }
        userState[chatId].step = 'cancelling';
        const bookingList = userBookings.map((b, index) => `${index + 1}. ${b.service}, ${b.time}`).join('\n');
        bot.sendMessage(chatId, `Выберите запись для отмены:\n${bookingList}`, {
            reply_markup: {
                keyboard: userBookings.map((b, index) => [`${index + 1}`]),
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        logMessage(`Bot to ${chatId}: Asked to select booking to cancel`);
        console.log(`Bot to ${chatId}: Asked to select booking to cancel`);

        bot.once('message', (msg) => {
            const index = parseInt(msg.text) - 1;
            if (userState[chatId].step !== 'cancelling') return;
            if (index >= 0 && index < userBookings.length) {
                const cancelledBooking = userBookings.splice(index, 1)[0];
                bot.sendMessage(chatId, `Запись "${cancelledBooking.service}, ${cancelledBooking.time}" отменена.`);
                logMessage(`User ${chatId} cancelled booking: ${cancelledBooking.service}, ${cancelledBooking.time}`);
                console.log(`User ${chatId} cancelled booking: ${cancelledBooking.service}, ${cancelledBooking.time}`);
            } else {
                bot.sendMessage(chatId, getMessage(chatId, 'unknownCommand'));
                logMessage(`Bot to ${chatId}: Invalid booking selection for cancellation`);
                console.log(`Bot to ${chatId}: Invalid booking selection for cancellation`);
            }
            userState[chatId].step = 'idle';
            startHandler(bot, chatId, getMessage);
        });
    } else if (text.toLowerCase() === getMessage(chatId, 'contactOwner').toLowerCase()) {
        userState[chatId].step = 'idle';
        bot.sendMessage(chatId, getMessage(chatId, 'contactInfo'));
        logMessage(`Bot to ${chatId}: Sent contact info`);
        console.log(`Bot to ${chatId}: Sent contact info`);
    } else if (text.toLowerCase() === getMessage(chatId, 'leaveReview').toLowerCase()) {
        userState[chatId].step = 'leaving_review';
        bot.sendMessage(chatId, getMessage(chatId, 'leaveReviewPrompt'));
        logMessage(`Bot to ${chatId}: Asked for review`);
        console.log(`Bot to ${chatId}: Asked for review`);

        bot.once('message', (msg) => {
            if (userState[chatId].step !== 'leaving_review') return;
            reviews[chatId] = reviews[chatId] || [];
            reviews[chatId].push(msg.text);
            bot.sendMessage(chatId, getMessage(chatId, 'reviewThanks'));
            logMessage(`User ${chatId} left review: ${msg.text}`);
            console.log(`User ${chatId} left review: ${msg.text}`);
            userState[chatId].step = 'idle';
            startHandler(bot, chatId, getMessage);
        });
    } else if (text.toLowerCase() === getMessage(chatId, 'changeLanguage').toLowerCase()) {
        bot.sendMessage(chatId, getMessage(chatId, 'selectLanguage'), {
            reply_markup: {
                keyboard: Object.keys(languages).map(lang => [languages[lang]]),
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        logMessage(`Bot to ${chatId}: Asked to change language`);
        console.log(`Bot to ${chatId}: Asked to change language`);
    } else {
        bot.sendMessage(chatId, getMessage(chatId, 'unknownCommand'));
        logMessage(`Bot replied to ${chatId}: Unknown command, asked to select from menu`);
        console.log(`Bot replied to ${chatId}: Unknown command, asked to select from menu`);
    }
});

// Логирование ошибок
bot.on('polling_error', (error) => {
    console.error('Ошибка Telegram:', error.message);
    logMessage(`Error: ${error.message}`);
    // Уведомление администратору (замените adminChatId на реальный ID)
    // bot.sendMessage(adminChatId, `Polling error: ${error.message}`);
});

console.log('Бот запущен в Telegram!');
logMessage('Bot started');
