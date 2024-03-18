import { Test, TestingModule } from '@nestjs/testing';
import { CurrencybotService } from './currencybot.service';

describe('CurrencybotService', () => {
  let service: CurrencybotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencybotService],
    }).compile();

    service = module.get<CurrencybotService>(CurrencybotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
