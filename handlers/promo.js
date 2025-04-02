// Импортируем данные об акциях и услугах
const promos = require('../data/promos');
const services = require('../data/services');

// Основная функция для отображения акций
module.exports = (bot, chatId, getMessage, userLanguages) => {
    // Определяем язык пользователя, по умолчанию — русский
    const lang = userLanguages[chatId] || 'ru';
    
    // Формируем текст акций на языке пользователя
    const promoText = promos.map(promo => {
        const service = services[promo.service];
        return `🔥 ${promo.text[lang]}\n${getMessage(chatId, 'newPrice')}: ${service.price * (1 - promo.discount)} RSD (${getMessage(chatId, 'insteadOf')} ${service.price} RSD)`;
    }).join('\n\n');
    
    // Отправляем сообщение с акциями
    bot.sendMessage(chatId, getMessage(chatId, 'promos', { promoText }));
};