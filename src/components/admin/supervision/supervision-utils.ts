import type { ProgressSummary } from "./types";

export function summarizeProgress(input: {
  totalModules: number;
  records: Array<{
    moduleId: string;
    moduleIndex: number | null;
    completedAt: Date;
  }>;
}) {
  const completedKeys = new Map<string, Date>();

  for (const record of input.records) {
    const key = record.moduleId || `legacy-${record.moduleIndex ?? "x"}`;
    const previous = completedKeys.get(key);

    if (!previous || previous.getTime() < record.completedAt.getTime()) {
      completedKeys.set(key, record.completedAt);
    }
  }

  const completedModules = completedKeys.size;
  const totalModules = input.totalModules;

  return {
    completedModules,
    totalModules,
    completionRate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
    lastCompletedAt:
      completedKeys.size > 0
        ? Array.from(completedKeys.values()).sort((left, right) => right.getTime() - left.getTime())[0]
        : null
  } satisfies ProgressSummary;
}
