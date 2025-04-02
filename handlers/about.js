// Основная функция для отображения информации о салоне
module.exports = (bot, chatId, getMessage) => {
    // Отправляем информацию о салоне
    bot.sendMessage(chatId, getMessage(chatId, 'about'));
};