import {Global, Module} from '@nestjs/common';
import {PubSubService} from './pubsub.service';
import {PubSubPublisher} from './pubsub-publisher.service';
import {TenantCdcWorker} from './workers/tenant-cdc.worker';
import {ReportContentCdcHandler} from './workers/handlers/report-content-cdc.handler';
import {DbModule} from '../db/db.module';

@Global()
@Module({
  imports: [DbModule],
  providers: [PubSubService, PubSubPublisher, TenantCdcWorker, ReportContentCdcHandler],
  exports: [PubSubPublisher],
})
export class PubSubModule {}
