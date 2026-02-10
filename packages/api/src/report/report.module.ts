import {Module} from '@nestjs/common';
import {ReportService} from './report.service';
import {ReportResolver} from './report.resolver';
import {DbModule} from '../db/db.module';

@Module({
  imports: [DbModule],
  providers: [ReportService, ReportResolver],
})
export class ReportModule {}
