// Импортируем необходимые модули
const services = require('../data/services'); // Список услуг
const schedule = require('../data/schedule'); // Доступное время для записи
const ai = require('./ai'); // Модуль для ИИ-рекомендаций
const fs = require('fs'); // Для логирования

// Функция для записи логов в файл bot.log
const logMessage = (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync('bot.log', logEntry);
};

// Основная функция обработчика записи
module.exports = (bot, chatId, userPreferences, userState, bookings, getMessage, userLanguages) => {
    // Определяем язык пользователя, по умолчанию — русский
    const lang = userLanguages[chatId] || 'ru';

    // Собираем все существующие записи, чтобы исключить занятые слоты
    const allBookings = Object.values(bookings).flat();
    // Фильтруем доступное время, исключая уже занятые слоты
    const availableSchedule = schedule.filter(time => !allBookings.some(booking => booking.time === time));

    // Формируем кнопки с услугами на языке пользователя
    const serviceButtons = Object.keys(services).map(key => [services[key].name[lang]]);
    // Отправляем сообщение с просьбой выбрать услугу
    bot.sendMessage(chatId, getMessage(chatId, 'selectService'), {
        reply_markup: {
            keyboard: serviceButtons,
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
    logMessage(`Bot to ${chatId}: Asked to select service`);

    // Обработчик выбора услуги
    const serviceListener = (msg) => {
        const text = msg.text.toLowerCase().trim();
        // Ищем услугу по тексту на языке пользователя
        const serviceKey = Object.keys(services).find(key => services[key].name[lang].toLowerCase() === text);
        logMessage(`User ${chatId} sent during service selection: ${msg.text}`);

        // Проверяем, что пользователь находится на этапе выбора услуги
        if (userState[chatId].step !== 'selecting_service') {
            return;
        }

        if (serviceKey) {
            // Сохраняем предпочтение пользователя для ИИ-рекомендаций
            userPreferences[chatId] = userPreferences[chatId] || [];
            userPreferences[chatId].push(serviceKey);
            userState[chatId].selectedService = serviceKey; // Сохраняем выбранную услугу
            userState[chatId].step = 'selecting_time'; // Переходим к выбору времени

            // Показываем доступные даты и время
            bot.sendMessage(chatId, getMessage(chatId, 'selectTime'), {
                reply_markup: {
                    // Если есть доступное время, показываем его, иначе — сообщение об отсутствии слотов
                    keyboard: availableSchedule.length > 0 ? availableSchedule.map(time => [time]) : [[getMessage(chatId, 'noAvailableSlots')]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
            logMessage(`Bot to ${chatId}: Asked to select time`);
        } else {
            // Если услуга не найдена, просим выбрать из кнопок
            bot.sendMessage(chatId, getMessage(chatId, 'invalidService'));
            logMessage(`Bot to ${chatId}: Invalid service, asked to select from buttons`);
        }
    };

    // Обработчик выбора времени
    const timeListener = (msg) => {
        const text = msg.text.trim();
        // Проверяем, что выбранное время доступно
        const selectedTime = availableSchedule.find(time => time === text);
        logMessage(`User ${chatId} sent during time selection: ${msg.text}`);

        // Проверяем, что пользователь находится на этапе выбора времени
        if (userState[chatId].step !== 'selecting_time') {
            return;
        }

        if (selectedTime) {
            userState[chatId].selectedTime = selectedTime; // Сохраняем выбранное время
            userState[chatId].step = 'adding_comment'; // Переходим к вводу комментария

            // Спрашиваем, хочет ли пользователь добавить комментарий
            bot.sendMessage(chatId, getMessage(chatId, 'addCommentPrompt'), {
                reply_markup: {
                    keyboard: [[getMessage(chatId, 'skip')]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
            logMessage(`Bot to ${chatId}: Asked for comment`);
        } else {
            // Если время недоступно, просим выбрать из кнопок
            bot.sendMessage(chatId, getMessage(chatId, 'invalidTime'));
            logMessage(`Bot to ${chatId}: Invalid time, asked to select from buttons`);
        }
    };

    // Обработчик ввода комментария
    const commentListener = (msg) => {
        const text = msg.text.trim();
        logMessage(`User ${chatId} sent during comment input: ${msg.text}`);

        // Проверяем, что пользователь находится на этапе ввода комментария
        if (userState[chatId].step !== 'adding_comment') {
            return;
        }

        const selectedServiceKey = userState[chatId].selectedService;
        const selectedService = services[selectedServiceKey].name[lang]; // Название услуги на языке пользователя
        const selectedTime = userState[chatId].selectedTime;

        // Сохраняем запись
        bookings[chatId] = bookings[chatId] || [];
        const comment = text === getMessage(chatId, 'skip').toLowerCase() ? null : text;
        bookings[chatId].push({
            service: selectedService,
            time: selectedTime,
            comment: comment
        });

        // Если пользователь пропустил комментарий, сообщаем об этом
        if (!comment) {
            bot.sendMessage(chatId, getMessage(chatId, 'commentSkipped'));
            logMessage(`Bot to ${chatId}: Comment skipped`);
        }

        // Подтверждаем запись
        bot.sendMessage(chatId, getMessage(chatId, 'bookingConfirmed', { service: selectedService, time: selectedTime }));
        logMessage(`Bot to ${chatId}: Confirmed booking: ${selectedService} at ${selectedTime}`);

        // ИИ-рекомендация на основе предпочтений пользователя
        const recommendation = ai.recommendService(userPreferences[chatId], lang);
        if (recommendation) {
            bot.sendMessage(chatId, recommendation);
            logMessage(`Bot to ${chatId}: Sent AI recommendation`);
        }

        // Переходим к завершённому состоянию и предлагаем дальнейшие действия
        userState[chatId].step = 'completed';
        bot.sendMessage(chatId, getMessage(chatId, 'whatNext'), {
            reply_markup: {
                keyboard: [
                    [getMessage(chatId, 'addAnotherBooking')],
                    [getMessage(chatId, 'checkMyBookings')],
                    [getMessage(chatId, 'backToMainMenu')],
                    [getMessage(chatId, 'contactOwner')],
                    [getMessage(chatId, 'leaveReview')],
                    [getMessage(chatId, 'changeLanguage')]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        logMessage(`Bot to ${chatId}: Asked what to do next`);

        // Удаляем слушатели, чтобы избежать дублирования
        bot.removeListener('message', serviceListener);
        bot.removeListener('message', timeListener);
        bot.removeListener('message', commentListener);
    };

    // Запускаем слушатели для обработки сообщений
    bot.on('message', serviceListener);
    bot.on('message', timeListener);
    bot.on('message', commentListener);
};