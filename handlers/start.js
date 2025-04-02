// Основная функция для отображения главного меню
module.exports = (bot, chatId, getMessage) => {
    // Отправляем приветственное сообщение и меню
    bot.sendMessage(chatId, getMessage(chatId, 'welcome'), {
        reply_markup: {
            keyboard: [
                [getMessage(chatId, 'addAnotherBooking'), getMessage(chatId, 'checkMyBookings')],
                [getMessage(chatId, 'priceList'), getMessage(chatId, 'promos')],
                [getMessage(chatId, 'about'), getMessage(chatId, 'contactOwner')],
                [getMessage(chatId, 'leaveReview'), getMessage(chatId, 'changeLanguage')]
            ],
            resize_keyboard: true
        }
    });
};