// Импортируем данные об услугах
const services = require('../data/services');

// Экспортируем модуль с функцией для ИИ-рекомендаций
module.exports = {
    // Функция для рекомендации дополнительных услуг
    recommendService: (userPreferences, lang) => {
        // Получаем последнюю выбранную услугу
        const lastService = userPreferences[userPreferences.length - 1];
        
        // Рекомендация для стрижки
        if (lastService === 'haircut') {
            if (lang === 'sr') {
                return "Изабрали сте шишање. Желите ли додати стилизацију да бисте употпунили изглед? То ће учинити ваш стил још упадљивијим! 💃\n" +
                       "Препоруке вештачке интелигенције повећавају просечан рачун за 15%! Желите исти бот? Пишите @YourUsername!";
            } else if (lang === 'en') {
                return "You chose a haircut. Want to add styling to complete your look? It will make your style even more striking! 💃\n" +
                       "AI recommendations increase the average bill by 15%! Want the same bot? Contact @YourUsername!";
            } else { // ru по умолчанию
                return "Вы выбрали стрижку. Хотите дополнить образ укладкой? Она сделает ваш стиль ещё ярче! 💃\n" +
                       "ИИ-рекомендации увеличивают средний чек на 15%! Хотите такой же бот? Напишите @YourUsername!";
            }
        } 
        // Рекомендация для окрашивания
        else if (lastService === 'coloring') {
            if (lang === 'sr') {
                return "Изабрали сте бојење. Желите ли додати стилизацију да бисте истакли нову боју? 💆\n" +
                       "Препоруке вештачке интелигенције повећавају просечан рачун за 15%! Желите исти бот? Пишите @YourUsername!";
            } else if (lang === 'en') {
                return "You chose coloring. Want to add styling to highlight your new color? 💆\n" +
                       "AI recommendations increase the average bill by 15%! Want the same bot? Contact @YourUsername!";
            } else { // ru по умолчанию
                return "Вы выбрали окрашивание. Хотите добавить укладку, чтобы подчеркнуть новый цвет? 💆\n" +
                       "ИИ-рекомендации увеличивают средний чек на 15%! Хотите такой же бот? Напишите @YourUsername!";
            }
        }
        return null; // Если рекомендаций нет, возвращаем null
    }
};