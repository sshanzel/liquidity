import {Global, Module} from '@nestjs/common';
import {DbModule} from '../db/db.module';
import {TemporalClientService} from './temporal-client.service';
import {TemporalWorkerService} from './temporal-worker.service';
import {ReportActivitiesService} from './activities/report-activities.service';

@Global()
@Module({
  imports: [DbModule],
  providers: [TemporalClientService, TemporalWorkerService, ReportActivitiesService],
  exports: [TemporalClientService],
})
export class TemporalModule {}
