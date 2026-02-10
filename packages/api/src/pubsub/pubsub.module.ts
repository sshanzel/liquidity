import {Global, Module} from '@nestjs/common';
import {PubSubService} from './pubsub.service';
import {PubSubPublisher} from './pubsub-publisher.service';
import {TenantCdcWorker} from './workers/tenant-cdc.worker';

@Global()
@Module({
  providers: [PubSubService, PubSubPublisher, TenantCdcWorker],
  exports: [PubSubPublisher],
})
export class PubSubModule {}
