export const PUBSUB_TOPICS = {
  TENANT_CDC: 'tenant-cdc',
} as const;

export const PUBSUB_SUBSCRIPTIONS: Record<string, {topic: string; name: string}> = {
  TENANT_CDC_WORKER: {
    topic: PUBSUB_TOPICS.TENANT_CDC,
    name: 'tenant-cdc-worker',
  },
};
