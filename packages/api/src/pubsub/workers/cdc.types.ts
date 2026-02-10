export interface DebeziumMessage<T = Record<string, unknown>> {
  source: {
    db: string;
    schema: string;
    table: string;
  };
  op: 'c' | 'u' | 'd' | 'r'; // create, update, delete, read (snapshot)
  before: T | null;
  after: T | null;
}

export abstract class BaseCdcHandler<T> {
  abstract readonly table: string;

  async handle(message: DebeziumMessage<T>): Promise<void> {
    switch (message.op) {
      case 'c':
        if (message.after) {
          await this.onInsert(message.after, message.source.db);
        }
        break;
      case 'u':
        if (message.before && message.after) {
          await this.onUpdate(message.before, message.after, message.source.db);
        }
        break;
      case 'd':
        if (message.before) {
          await this.onDelete(message.before, message.source.db);
        }
        break;
    }
  }

  protected async onInsert(_data: T, _database: string): Promise<void> {}
  protected async onUpdate(_before: T, _after: T, _database: string): Promise<void> {}
  protected async onDelete(_data: T, _database: string): Promise<void> {}
}
