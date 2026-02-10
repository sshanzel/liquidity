import {proxyActivities, sleep} from '@temporalio/workflow';
import type {ReportActivitiesService, ReportSource} from '../activities/report-activities.service';

type Activities = Pick<ReportActivitiesService, 'fetchFromSource' | 'updateReportContent'>;

const {fetchFromSource, updateReportContent} = proxyActivities<Activities>({
  startToCloseTimeout: '30s',
  retry: {
    maximumAttempts: 3,
  },
});

export interface FetchReportContentInput {
  tenantId: string;
  reportId: string;
  reportContentId: string;
  source: string;
}

export async function fetchReportContentWorkflow(input: FetchReportContentInput): Promise<void> {
  while (true) {
    const result = await fetchFromSource({
      tenantId: input.tenantId,
      reportId: input.reportId,
      reportContentId: input.reportContentId,
      source: input.source as ReportSource,
    });

    if (result.status === 'completed') {
      await updateReportContent(input.tenantId, input.reportContentId);
      break;
    }

    await sleep('10 seconds'); // Temporal's native delay
  }
}
