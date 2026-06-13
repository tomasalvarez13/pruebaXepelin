import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentKam } from '../auth/current-kam.decorator';
import { KamPayload } from '../auth/types';
import { EnrichmentService } from './enrichment.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class EnrichmentController {
  constructor(private readonly enrichment: EnrichmentService) {}

  /** Manually regenerate the AI analysis for one of the KAM's companies. */
  @Post(':id/enrich')
  enrich(@CurrentKam() kam: KamPayload, @Param('id') id: string) {
    return this.enrichment.enrichCompany(id, kam.id);
  }
}
