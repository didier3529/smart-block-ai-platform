import { performance } from 'perf_hooks'

interface PerformanceMetric {
  operation: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

interface PerformanceThresholds {
  warning: number // milliseconds
  critical: number // milliseconds
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private thresholds: Record<string, PerformanceThresholds> = {
    'api-request': { warning: 1000, critical: 3000 },
    'websocket-operation': { warning: 500, critical: 2000 },
    'data-transformation': { warning: 100, critical: 500 },
    'render': { warning: 16, critical: 50 }, // For 60fps target
  }
  private isEnabled: boolean = process.env.NODE_ENV === 'development'
  private maxMetrics: number = 1000 // Prevent memory leaks

  private constructor() {
    // Initialize any monitoring setup
    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private setupPerformanceObserver(): void {
    if (!window.PerformanceObserver) return

    // Observe long tasks
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'longtask') {
          this.addMetric({
            operation: 'long-task',
            startTime: entry.startTime,
            endTime: entry.startTime + entry.duration,
            duration: entry.duration,
            success: true,
            metadata: {
              name: entry.name,
              attribution: entry.attribution
            }
          })
        }
      })
    })

    observer.observe({ entryTypes: ['longtask'] })
  }

  startOperation(operation: string, metadata?: Record<string, any>): number {
    if (!this.isEnabled) return 0

    const startTime = performance.now()
    this.addMetric({
      operation,
      startTime,
      success: false,
      metadata
    })
    return startTime
  }

  endOperation(operation: string, startTime: number, error?: Error): void {
    if (!this.isEnabled) return

    const endTime = performance.now()
    const duration = endTime - startTime

    const metric = this.metrics.find(
      m => m.operation === operation && m.startTime === startTime && !m.endTime
    )

    if (metric) {
      metric.endTime = endTime
      metric.duration = duration
      metric.success = !error
      if (error) metric.error = error.message

      this.checkThresholds(metric)
    }

    // Cleanup old metrics if we've exceeded the limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds[metric.operation]
    if (!threshold || !metric.duration) return

    if (metric.duration >= threshold.critical) {
      console.error(
        `Critical performance issue in ${metric.operation}: ${metric.duration.toFixed(2)}ms`,
        metric
      )
    } else if (metric.duration >= threshold.warning) {
      console.warn(
        `Performance warning in ${metric.operation}: ${metric.duration.toFixed(2)}ms`,
        metric
      )
    }
  }

  setThreshold(operation: string, warning: number, critical: number): void {
    this.thresholds[operation] = { warning, critical }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
  }

  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation)
    }
    return this.metrics
  }

  getAverageMetrics(): Record<string, { 
    avgDuration: number
    successRate: number
    totalOperations: number
  }> {
    const result: Record<string, {
      totalDuration: number
      totalOperations: number
      successfulOperations: number
    }> = {}

    this.metrics.forEach(metric => {
      if (!metric.duration) return

      if (!result[metric.operation]) {
        result[metric.operation] = {
          totalDuration: 0,
          totalOperations: 0,
          successfulOperations: 0
        }
      }

      const stats = result[metric.operation]
      stats.totalDuration += metric.duration
      stats.totalOperations++
      if (metric.success) {
        stats.successfulOperations++
      }
    })

    return Object.entries(result).reduce((acc, [operation, stats]) => {
      acc[operation] = {
        avgDuration: stats.totalDuration / stats.totalOperations,
        successRate: (stats.successfulOperations / stats.totalOperations) * 100,
        totalOperations: stats.totalOperations
      }
      return acc
    }, {} as Record<string, any>)
  }

  clearMetrics(): void {
    this.metrics = []
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance() 