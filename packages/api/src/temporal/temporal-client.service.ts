import {Injectable, OnModuleInit, OnModuleDestroy, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Client, Connection} from '@temporalio/client';

@Injectable()
export class TemporalClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalClientService.name);
  private connection: Connection;
  private _client: Client;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const address = this.configService.get<string>('TEMPORAL_ADDRESS', 'localhost:7233');

    this.connection = await Connection.connect({address});
    this._client = new Client({connection: this.connection});

    this.logger.log(`Connected to Temporal at ${address}`);
  }

  async onModuleDestroy() {
    await this.connection?.close();
  }

  get client(): Client {
    return this._client;
  }
}
