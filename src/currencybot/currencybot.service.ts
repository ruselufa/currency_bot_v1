import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ICurrencyBotOptions } from './currencybot.inteface';
import { getTelegramConfig } from 'src/configs/telegram.config';
import { Parser } from 'xml2js';

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
	async getCurrencyRates(): Promise<{ [key: string]: string }> {
		try {
			// Запрос курсов валют с внешнего API
			const response = await axios.get('http://www.cbr.ru/scripts/XML_daily.asp');
			const dataCbrf = response.data;

			// Парсинг XML данных
			const parser = new Parser();
			const result = await parser.parseStringPromise(dataCbrf);

			// Извлечение курса USD
			const valutes = result.ValCurs.Valute;
			const usdValute = valutes.find(valute => valute.CharCode[0] === 'USD');
			const usdRate = usdValute.Value[0].replace(',', '.'); // Заменяем запятую на точку для корректного преобразования в число

			// Форматирование курса USD в нужном формате
        	const usdFormatted = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(usdRate);

			// Объект для хранения курсов валют
			const rates: { [key: string]: string } = {};
			rates.USD = usdFormatted;
			// Добавление обратных курсов для USD и EUR
			// rates.USD_inverse = (1 / rates.USD).toFixed(2);
			// rates.EUR_inverse = (1 / rates.EUR).toFixed(2);

			// Добавление курса биткоина к доллару
			const bitcoinRateResponse = await axios.get(
				'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
			);
			const bitcoinRate = bitcoinRateResponse.data.bitcoin.usd;
			const bitcoinFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(bitcoinRate);
			rates.BTC = bitcoinFormatted;
			// Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
			// 	bitcoinRate,
			// );

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
				🥇 BTC: ${rates.BTC} |
💵 USD: ${rates.USD} |
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

	async getCurrentDateForCbrf() {
		const now = new Date();

		//Форматирование даты в строку DD/MM/YYYY

		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();
		return `${day}/${month}/${year}`;
	}
}
