// Bound concurrent third-party loads; a stalled player must not block the rest.
export function createBackgroundQueue(concurrency = 3, timeoutMs = 6000) {
  interface Job {
    start: () => void;
    priority: number;
    active: boolean;
    finished: boolean;
    timeout?: ReturnType<typeof setTimeout>;
  }
  const pending: Job[] = [];
  let active = 0;
  let scheduled: ReturnType<typeof setTimeout> | undefined;

  function schedule() {
    if (scheduled !== undefined || !pending.length || active >= concurrency) return;
    scheduled = setTimeout(() => {
      scheduled = undefined;
      pending.sort((a, b) => b.priority - a.priority);
      while (active < concurrency && pending.length) {
        const job = pending.shift()!;
        job.active = true;
        active++;
        job.timeout = setTimeout(() => finish(job), timeoutMs);
        try { job.start(); } catch { finish(job); }
      }
    }, 100);
  }

  function finish(job: Job) {
    if (job.finished) return;
    job.finished = true;
    clearTimeout(job.timeout);
    if (job.active) active--;
    else {
      const index = pending.indexOf(job);
      if (index !== -1) pending.splice(index, 1);
    }
    schedule();
  }

  return {
    enqueue(start: () => void, priority = 0) {
      const job: Job = { start, priority, active: false, finished: false };
      pending.push(job);
      schedule();
      return {
        complete: () => finish(job),
        cancel: () => finish(job),
        prioritize: () => { job.priority = 1; },
      };
    },
  };
}
