import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CurrencybotService } from './currencybot/currencybot.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { CurrencybotModule } from './currencybot/currencybot.module';

@Module({
	imports: [ScheduleModule.forRoot(), ConfigModule.forRoot(), CurrencybotModule],
	controllers: [AppController],
	providers: [AppService, CurrencybotService],
})
export class AppModule {}
