import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {Message} from '@google-cloud/pubsub';
import {PubSubService} from '../pubsub.service';
import {PUBSUB_SUBSCRIPTIONS} from '../pubsub.constants';

@Injectable()
export class TenantCdcWorker implements OnModuleInit {
  private readonly logger = new Logger(TenantCdcWorker.name);

  constructor(private pubSubService: PubSubService) {}

  async onModuleInit() {
    const sub = PUBSUB_SUBSCRIPTIONS.TENANT_CDC_WORKER;
    await this.pubSubService.subscribe(sub.topic, sub.name, this.handleMessage.bind(this));
    this.logger.log('Tenant CDC worker started');
  }

  private async handleMessage(message: Message): Promise<void> {
    const data = JSON.parse(message.data.toString());
    this.logger.log(`Received message: ${JSON.stringify(data)}`);
  }
}
