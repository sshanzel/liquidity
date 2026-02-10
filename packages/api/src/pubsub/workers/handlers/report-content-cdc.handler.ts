import {Injectable, Logger} from '@nestjs/common';
import {BaseCdcHandler} from '../cdc.types';
import {TenantConnectionManager} from '../../../db/tenant-connection.manager';
import {TenantMapper} from '../../../db/tenant-mapper.service';
import {Report} from '../../../db/tenant/entities/report.entity';
import {ReportContent, ReportStatus} from '../../../db/tenant/entities/report-content.entity';

interface ReportContentData {
  id: string;
  reportId: string;
  source: string;
  status: ReportStatus;
  data: string | null;
  createdAt: string;
  lastRunAt: string;
}

@Injectable()
export class ReportContentCdcHandler extends BaseCdcHandler<ReportContentData> {
  readonly table = 'report_contents';
  private readonly logger = new Logger(ReportContentCdcHandler.name);

  constructor(
    private tenantConnectionManager: TenantConnectionManager,
    private tenantMapper: TenantMapper,
  ) {
    super();
  }

  protected async onInsert(data: ReportContentData, _database: string): Promise<void> {
    this.logger.log(`New report_content: ${data.id}, source: ${data.source}`);

    // TODO: Trigger Temporal workflow to fetch from data source
  }

  protected async onUpdate(
    before: ReportContentData,
    after: ReportContentData,
    database: string,
  ): Promise<void> {
    const statusChanged =
      before.status === ReportStatus.IN_PROGRESS &&
      after.status === ReportStatus.COMPLETED;

    if (!statusChanged) {
      return;
    }

    this.logger.log(`Report content completed: ${after.id}`);
    await this.checkReportCompletion(database, after.reportId);
  }

  private async checkReportCompletion(database: string, reportId: string): Promise<void> {
    const tenantId = this.tenantMapper.getTenantIdByDatabase(database);
    if (!tenantId) {
      this.logger.warn(`Unknown database: ${database}`);
      return;
    }

    const connection = await this.tenantConnectionManager.getConnection(tenantId);
    const contentRepo = connection.getRepository(ReportContent);
    const reportRepo = connection.getRepository(Report);

    const pendingCount = await contentRepo.count({
      where: {reportId, status: ReportStatus.IN_PROGRESS},
    });

    if (pendingCount === 0) {
      await reportRepo.update({id: reportId}, {finishedAt: new Date()});
      this.logger.log(`Report ${reportId} completed`);
    }
  }
}
