import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PubSub, Subscription, Message} from '@google-cloud/pubsub';
import {PUBSUB_TOPICS, PUBSUB_SUBSCRIPTIONS} from './pubsub.constants';
import {PubSubPublisher} from './pubsub-publisher.service';

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PubSubService.name);
  private client: PubSub;
  private subscriptions = new Map<string, Subscription>();

  constructor(
    private configService: ConfigService,
    private publisher: PubSubPublisher,
  ) {
    const emulatorHost = this.configService.get<string>('PUBSUB_EMULATOR_HOST');

    this.client = new PubSub({
      projectId: this.configService.get<string>('PUBSUB_PROJECT_ID', 'liquidity-local'),
      ...(emulatorHost && {apiEndpoint: emulatorHost}),
    });
  }

  async onModuleInit() {
    for (const topicName of Object.values(PUBSUB_TOPICS)) {
      await this.publisher.ensureTopicExists(topicName);
      this.logger.log(`Topic "${topicName}" initialized`);
    }

    for (const sub of Object.values(PUBSUB_SUBSCRIPTIONS)) {
      await this.createSubscriptionIfNotExists(sub.topic, sub.name);
      this.logger.log(`Subscription "${sub.name}" initialized`);
    }
  }

  async onModuleDestroy() {
    for (const subscription of this.subscriptions.values()) {
      subscription.close();
    }
    await this.client.close();
  }

  private async createSubscriptionIfNotExists(
    topicName: string,
    subscriptionName: string,
  ): Promise<Subscription> {
    const key = `${topicName}:${subscriptionName}`;
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }

    const topic = this.client.topic(topicName);
    const subscription = topic.subscription(subscriptionName);
    const [exists] = await subscription.exists();
    if (!exists) {
      try {
        await subscription.create();
      } catch (error: any) {
        if (error.code !== 6) throw error;
      }
    }

    this.subscriptions.set(key, subscription);
    return subscription;
  }

  async subscribe(
    topicName: string,
    subscriptionName: string,
    handler: (message: Message) => Promise<void>,
  ): Promise<void> {
    const subscription = await this.createSubscriptionIfNotExists(
      topicName,
      subscriptionName,
    );

    subscription.on('message', async (message: Message) => {
      try {
        await handler(message);
        message.ack();
      } catch (error) {
        this.logger.error('Error processing message:', error);
        message.nack();
      }
    });

    subscription.on('error', (error) => {
      this.logger.error('Subscription error:', error);
    });
  }
}
