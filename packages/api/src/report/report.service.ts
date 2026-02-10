import {Injectable} from '@nestjs/common';
import {TenantConnectionManager} from '../db/tenant-connection.manager';
import {Report} from '../db/tenant/entities/report.entity';
import {ReportContent, ReportStatus} from '../db/tenant/entities/report-content.entity';
import {REPORT_SOURCES} from './report.constants';
import {ReportStatusResponse, ReportStatusEnum} from './dto/report-status.response';

@Injectable()
export class ReportService {
  constructor(private tenantConnectionManager: TenantConnectionManager) {}

  async startReport(tenantId: string, userId: string): Promise<Report> {
    const connection = await this.tenantConnectionManager.getConnection(tenantId);
    const reportRepo = connection.getRepository(Report);
    const contentRepo = connection.getRepository(ReportContent);

    const report = reportRepo.create({
      tenantId,
      userId,
    });
    await reportRepo.save(report);

    const contents = REPORT_SOURCES.map(source =>
      contentRepo.create({
        reportId: report.id,
        source,
        status: ReportStatus.IN_PROGRESS,
      }),
    );
    await contentRepo.save(contents);

    report.contents = contents;
    return report;
  }

  async getReportStatus(
    tenantId: string,
    reportId: string,
  ): Promise<ReportStatusResponse | null> {
    const connection = await this.tenantConnectionManager.getConnection(tenantId);
    const reportRepo = connection.getRepository(Report);

    const report = await reportRepo.findOne({
      where: {id: reportId},
      select: ['id', 'finishedAt'],
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      status: report.finishedAt ? ReportStatusEnum.COMPLETED : ReportStatusEnum.IN_PROGRESS,
    };
  }

  async getReport(tenantId: string, reportId: string): Promise<Report | null> {
    const connection = await this.tenantConnectionManager.getConnection(tenantId);
    const reportRepo = connection.getRepository(Report);

    return reportRepo.findOne({
      where: {id: reportId},
      relations: ['contents'],
    });
  }

  async getUserReports(tenantId: string, userId: string): Promise<Report[]> {
    const connection = await this.tenantConnectionManager.getConnection(tenantId);
    const reportRepo = connection.getRepository(Report);

    return reportRepo.find({
      where: {userId},
      relations: ['contents'],
      order: {startedAt: 'DESC'},
    });
  }
}
