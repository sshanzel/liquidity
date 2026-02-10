import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PubSub, Topic} from '@google-cloud/pubsub';

@Injectable()
export class PubSubPublisher {
  private client: PubSub;
  private topics = new Map<string, Topic>();

  constructor(private configService: ConfigService) {
    const emulatorHost = this.configService.get<string>('PUBSUB_EMULATOR_HOST');

    this.client = new PubSub({
      projectId: this.configService.get<string>('PUBSUB_PROJECT_ID', 'liquidity-local'),
      ...(emulatorHost && {apiEndpoint: emulatorHost}),
    });
  }

  async publish<T>(topicName: string, data: T): Promise<string> {
    const topic = await this.getOrCreateTopic(topicName);
    return topic.publishMessage({json: data});
  }

  async ensureTopicExists(topicName: string): Promise<void> {
    await this.getOrCreateTopic(topicName);
  }

  private async getOrCreateTopic(topicName: string): Promise<Topic> {
    if (this.topics.has(topicName)) {
      return this.topics.get(topicName)!;
    }

    const topic = this.client.topic(topicName);
    const [exists] = await topic.exists();

    if (!exists) {
      try {
        await topic.create();
      } catch (error: any) {
        if (error.code !== 6) throw error;
      }
    }

    this.topics.set(topicName, topic);
    return topic;
  }
}
