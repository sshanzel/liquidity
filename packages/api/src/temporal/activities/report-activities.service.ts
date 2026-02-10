import {Injectable, Logger} from '@nestjs/common';
import {TenantConnectionManager} from '../../db/tenant-connection.manager';
import {ReportContent, ReportStatus} from '../../db/tenant/entities/report-content.entity';

export type ReportSource = 'source_1' | 'source_2' | 'source_3';

export interface FetchSourceInput {
  tenantId: string;
  reportId: string;
  reportContentId: string;
  source: ReportSource;
}

export interface FetchSourceResult {
  id: string;
  status: 'in_progress' | 'completed';
}

const SOURCE_ENDPOINTS: Record<ReportSource, string> = {
  source_1: 'https://api.example.com/source1',
  source_2: 'https://api.example.com/source2',
  source_3: 'https://api.example.com/source3',
};

@Injectable()
export class ReportActivitiesService {
  private readonly logger = new Logger(ReportActivitiesService.name);
  private attemptCounts = new Map<string, number>();

  constructor(private tenantConnectionManager: TenantConnectionManager) {}

  async fetchFromSource(input: FetchSourceInput): Promise<FetchSourceResult> {
    const endpoint = SOURCE_ENDPOINTS[input.source];
    const attempt = (this.attemptCounts.get(input.reportContentId) || 0) + 1;
    this.attemptCounts.set(input.reportContentId, attempt);

    this.logger.log(`Fetching from ${input.source} (${endpoint}) - attempt ${attempt}`);

    // just to simulate different statuses based on attempt count and randomness
    const status = attempt <= 3 ? 'in_progress' : Math.random() > 0.5 ? 'completed' : 'in_progress';

    const result: FetchSourceResult = {
      id: input.reportContentId,
      status,
    };

    this.logger.log(`Source ${input.source} returned status: ${result.status}`);
    return result;
  }

  async updateReportContent(tenantId: string, reportContentId: string): Promise<void> {
    this.logger.log(`Updating report content ${reportContentId}`);
    this.attemptCounts.delete(reportContentId);

    const connection = await this.tenantConnectionManager.getConnection(tenantId);
    const contentRepo = connection.getRepository(ReportContent);

    await contentRepo.update(
      {id: reportContentId},
      {
        status: ReportStatus.COMPLETED,
        lastRunAt: new Date(),
      },
    );

    this.logger.log(`Report content ${reportContentId} updated to COMPLETED`);
  }
}
