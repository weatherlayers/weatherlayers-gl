
export class Queue {
  private queue = Promise.resolve();

  async run<T>(operation: () => Promise<T>): Promise<T> {
    const currentQueue = this.queue;
    let resolveQueue: () => void;
    
    this.queue = new Promise(resolve => {
      resolveQueue = resolve;
    });
    
    try {
      await currentQueue;
      return await operation();
    } finally {
      resolveQueue!();
    }
  }
}