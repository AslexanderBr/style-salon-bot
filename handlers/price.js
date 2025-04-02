const services = require('../data/services');

module.exports = (bot, chatId, getMessage, userLanguages) => {
    const lang = userLanguages[chatId] || 'ru';
    const priceList = Object.keys(services).map(key => {
        const service = services[key];
        return `${service.name[lang]} — ${service.price} RSD (${service.description[lang]})`;
    }).join('\n');
    bot.sendMessage(chatId, getMessage(chatId, 'priceList', { priceList }));
};