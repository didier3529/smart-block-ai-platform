import { EventEmitter } from 'events';
import { AgentWorkflow, TaskQueueConfig, TaskQueueEvent } from '../types';
import { generateId } from '../utils/id';

export class TaskQueue extends EventEmitter {
  private queue: AgentWorkflow[] = [];
  private running: Set<string> = new Set();
  private readonly config: TaskQueueConfig;
  private workflowStartTimes: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<TaskQueueConfig> = {}) {
    super();
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 3,
      queueTimeout: config.queueTimeout ?? 1800000, // 30 minutes default
      retryFailedTasks: config.retryFailedTasks ?? true,
      maxRetries: config.maxRetries ?? 3,
      ...config
    };
    
    // Start the cleanup interval
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // Check for stuck tasks every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStuckTasks();
    }, 300000); // 5 minutes
  }

  private cleanupStuckTasks(): void {
    const now = Date.now();
    for (const workflowId of this.running) {
      const startTime = this.workflowStartTimes.get(workflowId);
      if (startTime && (now - startTime) > this.config.queueTimeout) {
        this.running.delete(workflowId);
        this.workflowStartTimes.delete(workflowId);
        this.emit('workflowTimeout', {
          workflowId,
          timestamp: now,
          duration: now - startTime
        });
      }
    }
  }

  enqueue(workflow: AgentWorkflow): void {
    this.queue.push(workflow);
    this.emit('workflowQueued', {
      workflowId: workflow.id,
      queuePosition: this.queue.length - 1,
      timestamp: Date.now()
    });
    this.processQueue();
  }

  dequeue(workflowId: string): boolean {
    const index = this.queue.findIndex(w => w.id === workflowId);
    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    this.emit('workflowDequeued', {
      workflowId,
      timestamp: Date.now()
    });
    return true;
  }

  pause(): void {
    this.emit('queuePaused', {
      timestamp: Date.now(),
      remainingTasks: this.queue.length,
      runningTasks: this.running.size
    });
  }

  resume(): void {
    this.emit('queueResumed', {
      timestamp: Date.now()
    });
    this.processQueue();
  }

  clear(): void {
    this.queue = [];
    this.emit('queueCleared', {
      timestamp: Date.now()
    });
  }

  getQueueStatus(): {
    queued: number;
    running: number;
    total: number;
  } {
    return {
      queued: this.queue.length,
      running: this.running.size,
      total: this.queue.length + this.running.size
    };
  }

  private async processQueue(): Promise<void> {
    if (this.running.size >= this.config.maxConcurrent) {
      return;
    }

    while (
      this.queue.length > 0 &&
      this.running.size < this.config.maxConcurrent
    ) {
      const workflow = this.queue.shift();
      if (!workflow) continue;

      this.running.add(workflow.id);
      this.workflowStartTimes.set(workflow.id, Date.now());
      this.emit('workflowStarted', {
        workflowId: workflow.id,
        timestamp: Date.now()
      });

      try {
        await this.executeWorkflow(workflow);
        this.emit('workflowCompleted', {
          workflowId: workflow.id,
          timestamp: Date.now(),
          results: workflow.results
        });
      } catch (error) {
        const shouldRetry =
          this.config.retryFailedTasks &&
          (workflow as any)._retryCount < this.config.maxRetries;

        if (shouldRetry) {
          (workflow as any)._retryCount = ((workflow as any)._retryCount || 0) + 1;
          this.queue.push(workflow);
          this.emit('workflowRetrying', {
            workflowId: workflow.id,
            error,
            retryCount: (workflow as any)._retryCount,
            timestamp: Date.now()
          });
        } else {
          this.emit('workflowFailed', {
            workflowId: workflow.id,
            error,
            timestamp: Date.now()
          });
        }
      } finally {
        this.running.delete(workflow.id);
        this.workflowStartTimes.delete(workflow.id);
        this.processQueue();
      }
    }
  }

  private async executeWorkflow(workflow: AgentWorkflow): Promise<void> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Workflow ${workflow.id} exceeded queue timeout`));
      }, this.config.queueTimeout);
    });

    try {
      await Promise.race([workflow.execute(), timeoutPromise]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Workflow ${workflow.id} failed: ${error.message}`
        );
      }
      throw error;
    }
  }

  // Clean up interval when queue is destroyed
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
} 