import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {Message} from '@google-cloud/pubsub';
import {PubSubService} from '../pubsub.service';
import {PUBSUB_SUBSCRIPTIONS} from '../pubsub.constants';
import {DebeziumMessage, BaseCdcHandler} from './cdc.types';
import {ReportContentCdcHandler} from './handlers/report-content-cdc.handler';

@Injectable()
export class TenantCdcWorker implements OnModuleInit {
  private readonly logger = new Logger(TenantCdcWorker.name);
  private handlers = new Map<string, BaseCdcHandler<unknown>>();

  constructor(
    private pubSubService: PubSubService,
    private reportContentCdcHandler: ReportContentCdcHandler,
  ) {
    this.registerHandler(this.reportContentCdcHandler);
  }

  private registerHandler(handler: BaseCdcHandler<unknown>): void {
    this.handlers.set(handler.table, handler);
    this.logger.log(`Registered CDC handler for table: ${handler.table}`);
  }

  async onModuleInit() {
    const sub = PUBSUB_SUBSCRIPTIONS.TENANT_CDC_WORKER;
    await this.pubSubService.subscribe(sub.topic, sub.name, this.handleMessage.bind(this));
    this.logger.log('Tenant CDC worker started');
  }

  private async handleMessage(message: Message): Promise<void> {
    const raw = JSON.parse(message.data.toString());
    const data = (raw.payload ?? raw) as DebeziumMessage;

    if (!data.source) {
      this.logger.warn(`Invalid CDC message, no source field`);
      return;
    }

    this.logger.log(`CDC event: ${data.op} on ${data.source.table} (${data.source.db})`);

    const handler = this.handlers.get(data.source.table);
    if (!handler) {
      return;
    }

    await handler.handle(data);
  }
}
