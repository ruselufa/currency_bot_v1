import { ConfigService } from '@nestjs/config';
import { ICurrencyBotOptions } from 'src/currencybot/currencybot.inteface';

export const getTelegramConfig = (configService: ConfigService): ICurrencyBotOptions => {
	try {
		// Вывод текущих переменных окружения (для отладки)
		console.log(process.env);

		// Получение токена Telegram из ConfigService
		const token = configService.get('TELEGRAM_TOKEN');
		if (!token) {
			// Если токен отсутствует, выбрасываем ошибку
			throw new Error('TELEGRAM_TOKEN is not defined');
		}

		// Получение ID чата и закрепленного сообщения из ConfigService
		const chatId = configService.get('TELEGRAM_CHAT_ID');
		const pinnedMessageId = configService.get('TELEGRAM_PINNED_MESSAGE_ID');

		// Возвращаем объект с настройками бота Telegram
		return {
			token,
			chatId,
			pinnedMessageId,
		};
	} catch (error) {
		// Обработка ошибок при получении настроек Telegram
		console.error('Error getting Telegram configuration:', error);
		throw error;
	}
};
