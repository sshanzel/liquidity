export const REPORT_SOURCES = ['source_1', 'source_2', 'source_3'] as const;

export type ReportSource = (typeof REPORT_SOURCES)[number];
