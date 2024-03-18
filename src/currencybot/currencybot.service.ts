// import { Injectable, Logger } from '@nestjs/common';
// import * as TelegramBot from 'node-telegram-bot-api';
// import axios from 'axios';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { ConfigService } from '@nestjs/config';
// import { ICurrencyBotOptions } from './currencybot.inteface';
// import { getTelegramConfig } from 'src/configs/telegram.config';

// @Injectable()
// export class CurrencybotService {
// 	private readonly logger = new Logger(CurrencybotService.name);
// 	private readonly telegramConfig: ICurrencyBotOptions;
// 	private readonly bot: TelegramBot;

// 	constructor(private readonly configService: ConfigService) {
// 		// Замените 'YOUR_TELEGRAM_BOT_TOKEN' на токен вашего бота
// 		this.telegramConfig = getTelegramConfig(configService);
// 		this.bot = new TelegramBot(this.telegramConfig.token, { polling: true });
// 	}

// 	async getCurrencyRates(): Promise<{ [key: string]: number }> {
// 		try {
// 			// Запрашиваем курсы валют
// 			const response = await axios.get('https://api.exchangerate-api.com/v4/latest/RUB');
// 			const rates = response.data.rates;

// 			// Добавляем обратные курсы
// 			rates.USD_inverse = (1 / rates.USD).toFixed(2);
// 			rates.EUR_inverse = (1 / rates.EUR).toFixed(2);

// 			// Добавляем курс биткоина (можно использовать любой сервис для получения курса биткоина)
// 			const bitcoinRateResponse = await axios.get(
// 				'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
// 			);
// 			const bitcoinRate = bitcoinRateResponse.data.bitcoin.usd; // Получаем курс биткоина к доллару
// 			rates.BTC = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
// 				bitcoinRate,
// 			); // Форматируем курс биткоина к доллару и добавляем курс биткоина к курсам доллара и евроbitcoinRate;

// 			return rates;
// 		} catch (error) {
// 			this.logger.error('Error fetching currency rates:', error);
// 			throw error;
// 		}
// 	}

// 	@Cron(CronExpression.EVERY_30_MINUTES)
// 	async hadleCron() {
// 		await this.updatePinnedMessage();
// 	}

// 	async updatePinnedMessage() {
// 		try {
// 			const rates = await this.getCurrencyRates();
// 			console.log('ratesUSD ', rates.USD_inverse);
// 			console.log('ratesEUR ', rates.EUR_inverse);
// 			console.log('ratesBTC ', rates.BTC);

// 			// Формируем текст сообщения
// 			const messageText = `
//                 💵 USD: ${rates.USD_inverse} ₽ |
// 💶 EUR: ${rates.EUR_inverse} ₽ |
// ₿ BTC: ${rates.BTC}
//             `;

// 			// Получаем информацию о закрепленном сообщении в канале
// 			const chatId = this.telegramConfig.chatId; // Замените на ID вашего канала
// 			const pinnedMessageId = this.telegramConfig.pinnedMessageId; // Замените на ID закрепленного сообщения
// 			await this.bot.editMessageText(messageText, {
// 				chat_id: chatId,
// 				message_id: pinnedMessageId,
// 				parse_mode: 'HTML', // Укажите, если ваш текст содержит HTML разметку
// 			});

// 			this.logger.log('Pinned message updated successfully');
// 		} catch (error) {
// 			this.logger.error('Error updating pinned message:', error);
// 		}
// 	}
// }
import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ICurrencyBotOptions } from './currencybot.inteface';
import { getTelegramConfig } from 'src/configs/telegram.config';

@Injectable()
export class CurrencybotService {
	private readonly logger = new Logger(CurrencybotService.name);
	private readonly telegramConfig: ICurrencyBotOptions;
	private readonly bot: TelegramBot;

	constructor(private readonly configService: ConfigService) {
		// Получаем конфигурацию для Telegram из ConfigService
		this.telegramConfig = getTelegramConfig(configService);
		// Инициализируем Telegram бота с использованием полученного токена
		this.bot = new TelegramBot(this.telegramConfig.token, { polling: true });
	}

	// Метод для получения курсов валют
	async getCurrencyRates(): Promise<{ [key: string]: number }> {
		try {
			// Запрос курсов валют с внешнего API
			const response = await axios.get('https://api.exchangerate-api.com/v4/latest/RUB');
			const rates = response.data.rates;

			// Добавление обратных курсов для USD и EUR
			rates.USD_inverse = (1 / rates.USD).toFixed(2);
			rates.EUR_inverse = (1 / rates.EUR).toFixed(2);

			// Добавление курса биткоина к доллару
			const bitcoinRateResponse = await axios.get(
				'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
			);
			const bitcoinRate = bitcoinRateResponse.data.bitcoin.usd;
			rates.BTC = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
				bitcoinRate,
			);

			return rates;
		} catch (error) {
			// Обработка ошибок при получении курсов валют
			this.logger.error('Error fetching currency rates:', error);
			throw error;
		}
	}

	// Запуск задачи обновления закрепленного сообщения через cron
	@Cron(CronExpression.EVERY_30_MINUTES)
	async handleCron() {
		await this.updatePinnedMessage();
	}

	// Метод для обновления закрепленного сообщения в Telegram канале
	async updatePinnedMessage() {
		try {
			// Получение текущих курсов валют
			const rates = await this.getCurrencyRates();

			// Формирование текста для сообщения
			const messageText = `
                💵 USD: ${rates.USD_inverse} ₽ |
💶 EUR: ${rates.EUR_inverse} ₽ |
🥇 BTC: ${rates.BTC} |
            `;

			// Отправка обновленного сообщения в канал
			const chatId = this.telegramConfig.chatId; // ID вашего канала
			const pinnedMessageId = this.telegramConfig.pinnedMessageId; // ID закрепленного сообщения
			await this.bot.editMessageText(messageText, {
				chat_id: chatId,
				message_id: pinnedMessageId,
				parse_mode: 'HTML', // Указываем форматирование HTML для сообщения
			});

			this.logger.log('Pinned message updated successfully');
		} catch (error) {
			// Обработка ошибок при обновлении закрепленного сообщения
			this.logger.error('Error updating pinned message:', error);
		}
	}
}
