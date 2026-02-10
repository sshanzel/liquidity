import {Injectable, Logger} from '@nestjs/common';
import {BaseCdcHandler} from '../cdc.types';
import {TenantConnectionManager} from '../../../db/tenant-connection.manager';
import {TenantMapper} from '../../../db/tenant-mapper.service';
import {TemporalClientService} from '../../../temporal/temporal-client.service';
import {TEMPORAL_TASK_QUEUE} from '../../../temporal/temporal.constants';
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
    private temporalClient: TemporalClientService,
  ) {
    super();
  }

  protected async onInsert(data: ReportContentData, database: string): Promise<void> {
    const tenantId = this.tenantMapper.getTenantIdByDatabase(database);
    if (!tenantId) {
      this.logger.warn(`Unknown database: ${database}`);
      return;
    }

    this.logger.log(`New report_content: ${data.id}, source: ${data.source}`);

    await this.temporalClient.client.workflow.start('fetchReportContentWorkflow', {
      taskQueue: TEMPORAL_TASK_QUEUE,
      workflowId: `fetch-${data.id}`,
      args: [{
        tenantId,
        reportId: data.reportId,
        reportContentId: data.id,
        source: data.source,
      }],
    });

    this.logger.log(`Started workflow for report_content: ${data.id}`);
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
