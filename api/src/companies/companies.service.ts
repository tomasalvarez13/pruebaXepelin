import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeSignals } from '../signals/signals.service';
import { buildCompanyInput } from '../signals/company-input';
import { serializeCompany } from '../common/decimal.util';
import { UpdateCompanyDto } from './companies.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForKam(
    kamId: string,
    sort?: string,
    filter?: string,
  ) {
    const companies = await this.prisma.company.findMany({
      where: { kamId },
      include: {
        operations: true,
        interactions: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    const results = companies.map((c) => {
      const serialized = serializeCompany(c as unknown as Record<string, unknown>);
      const signals = computeSignals(buildCompanyInput(c));
      const lastInteractionDate = c.interactions[0]?.date ?? null;
      const daysSinceLastInteraction = lastInteractionDate
        ? Math.floor((Date.now() - lastInteractionDate.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      return {
        ...serialized,
        operations: undefined,
        interactions: undefined,
        signals,
        daysSinceLastInteraction,
      };
    });

    // Effective churn: AI value once enriched, deterministic signal as fallback.
    // Keeps list filtering/sorting consistent with what each row shows.
    const effectiveChurn = (r: (typeof results)[number]) =>
      (r as { churnRisk?: 'LOW' | 'MEDIUM' | 'HIGH' | null }).churnRisk ??
      r.signals.churnRisk;

    let filtered = results;
    if (filter === 'at_risk') {
      filtered = results.filter((r) => effectiveChurn(r) === 'HIGH');
    } else if (filter === 'expansion') {
      filtered = results.filter((r) => r.signals.expansion);
    }

    const priorityOrder = { ALTA: 0, MEDIA: 1, BAJA: 2 };
    const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    if (sort === 'risk') {
      filtered.sort((a, b) => riskOrder[effectiveChurn(a)] - riskOrder[effectiveChurn(b)]);
    } else if (sort === 'volume') {
      filtered.sort((a, b) => b.signals.financedVolume90d - a.signals.financedVolume90d);
    } else {
      filtered.sort((a, b) => priorityOrder[a.signals.priorityLabel] - priorityOrder[b.signals.priorityLabel]);
    }

    return filtered;
  }

  async findOneForKam(kamId: string, companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        operations: { orderBy: { date: 'desc' } },
        interactions: { orderBy: { date: 'desc' } },
      },
    });

    if (!company) throw new NotFoundException('Company not found');
    if (company.kamId !== kamId) throw new ForbiddenException('Not your company');

    const serialized = serializeCompany(company as unknown as Record<string, unknown>);
    const signals = computeSignals(buildCompanyInput(company));

    return { ...serialized, signals };
  }

  async updateCompany(kamId: string, companyId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.kamId !== kamId) throw new ForbiddenException('Not your company');

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: dto,
      include: {
        operations: { orderBy: { date: 'desc' } },
        interactions: { orderBy: { date: 'desc' } },
      },
    });

    return serializeCompany(updated as unknown as Record<string, unknown>);
  }
}
