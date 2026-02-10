import {Args, ID, Mutation, Query, Resolver} from '@nestjs/graphql';
import {UseGuards} from '@nestjs/common';
import {ReportService} from './report.service';
import {Report} from '../db/tenant/entities/report.entity';
import {ReportStatusResponse} from './dto/report-status.response';
import {GqlAuthGuard} from '../auth/guards/gql-auth.guard';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {User} from '../db/catalog/entities/user.entity';

@Resolver(() => Report)
@UseGuards(GqlAuthGuard)
export class ReportResolver {
  constructor(private reportService: ReportService) {}

  @Mutation(() => Report)
  async startReport(@CurrentUser() user: User): Promise<Report> {
    return this.reportService.startReport(user.tenantId, user.id);
  }

  @Query(() => ReportStatusResponse, {nullable: true})
  async reportStatus(
    @CurrentUser() user: User,
    @Args('id', {type: () => ID}) id: string,
  ): Promise<ReportStatusResponse | null> {
    return this.reportService.getReportStatus(user.tenantId, id);
  }

  @Query(() => Report, {nullable: true})
  async report(
    @CurrentUser() user: User,
    @Args('id', {type: () => ID}) id: string,
  ): Promise<Report | null> {
    return this.reportService.getReport(user.tenantId, id);
  }

  @Query(() => [Report])
  async myReports(@CurrentUser() user: User): Promise<Report[]> {
    return this.reportService.getUserReports(user.tenantId, user.id);
  }
}
