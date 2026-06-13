import { Module } from '@nestjs/common';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentService } from './enrichment.service';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [EnrichmentController],
  providers: [GeminiService, EnrichmentService],
})
export class EnrichmentModule {}
