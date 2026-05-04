export type LogEvent = {
  traceId: string;
  step: string;
  latencyMs?: number;
  message: string;
  data?: Record<string, unknown>;
};

export class Logger {
  constructor(private readonly verbose: boolean) {}

  info(event: LogEvent): void {
    if (!this.verbose) {
      return;
    }
    console.log(JSON.stringify({ level: "info", ...event }));
  }

  error(event: LogEvent): void {
    console.error(JSON.stringify({ level: "error", ...event }));
  }
}

export function redactObject(input: Record<string, unknown>): Record<string, unknown> {
  const clone = { ...input };
  for (const key of Object.keys(clone)) {
    if (key.toLowerCase().includes("message")) {
      clone[key] = "[redacted]";
    }
  }
  return clone;
}
