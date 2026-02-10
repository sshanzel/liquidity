import {Injectable, OnModuleInit, OnModuleDestroy, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Worker, NativeConnection} from '@temporalio/worker';
import {TEMPORAL_TASK_QUEUE} from './temporal.constants';
import {ReportActivitiesService} from './activities/report-activities.service';

@Injectable()
export class TemporalWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalWorkerService.name);
  private worker: Worker;

  constructor(
    private configService: ConfigService,
    private reportActivities: ReportActivitiesService,
  ) {}

  async onModuleInit() {
    const address = this.configService.get<string>('TEMPORAL_ADDRESS', 'localhost:7233');
    const connection = await NativeConnection.connect({address});

    this.worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: TEMPORAL_TASK_QUEUE,
      workflowsPath: require.resolve('./workflows/report.workflow'),
      bundlerOptions: {
        ignoreModules: [
          '@nestjs/common',
          '@nestjs/config',
          'typeorm',
          'pg',
        ],
      },
      activities: {
        fetchFromSource: this.reportActivities.fetchFromSource.bind(this.reportActivities),
        updateReportContent: this.reportActivities.updateReportContent.bind(this.reportActivities),
      },
    });

    this.worker.run().catch(err => {
      this.logger.error('Worker failed', err);
    });

    this.logger.log(`Temporal worker started on queue: ${TEMPORAL_TASK_QUEUE}`);
  }

  async onModuleDestroy() {
    try {
      await this.worker?.shutdown();
    } catch (err) {
      // Ignore if already draining/stopped
    }
  }
}
