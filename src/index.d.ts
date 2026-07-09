export interface Tick { t: number; sym: string; col: string; v: number }

export interface Trace {
  schema: 'tickbench-trace/1';
  seed: number;
  synthetic: boolean;
  generated: string | null;
  symbols: string[];
  cols: string[];
  durationMs: number;
  ticks: Tick[];
}

export interface TraceOptions {
  seed?: number;
  durationMs?: number;
  symbolCount?: number;
  burst?: { fromMs: number; toMs: number; factor: number };
  xssCanary?: boolean;
}

export function generateTrace(options?: TraceOptions): Trace;
export function mulberry32(seed: number): () => number;

export interface RuntimeMetrics {
  ticksDispatched: number;
  cellsChecked: number;
  catchUpMs: { p50: number | null; p95: number | null; p99: number | null; n: number };
  staleCellFramePct: number | null;
  frames: number;
  longFramePct: number | null;
  worstFrameMs: number | null;
  finalValueErrors: number;
  finalFormatErrors: number;
  xssTriggered: boolean;
  implError: string | null;
}

export function runRuntimeOracle(options: { implPath: string; trace: Trace; quiescenceMs?: number }): Promise<RuntimeMetrics>;

export interface A11yViolation { id: string; impact: string | null; nodes: number }
export function runA11yOracle(options: { implPath: string; trace: Trace; warmupTicks?: number }): Promise<A11yViolation[]>;

export interface SecurityFinding { id: string; severity: 'high' | 'medium'; count: number; why: string }
export interface SecurityRule { id: string; re: RegExp; severity: 'high' | 'medium'; why: string }
export const RULES: SecurityRule[];
export function scanSecurity(path: string): SecurityFinding[];
export function scanSecuritySource(src: string): SecurityFinding[];

export interface Thresholds {
  catchUpP95Ms: number;
  staleCellFramePctMax: number;
  longFramePctMax: number;
  finalErrorsMax?: number;
  axeViolationsMax?: number;
  highSecurityFindingsMax?: number;
}

export interface Verdict {
  functional_final_state: boolean;
  staleness: boolean;
  frame_stability: boolean;
  security: boolean;
  accessibility: boolean;
  no_runtime_error: boolean;
  regulated_grade_pass: boolean;
}

export function computeVerdict(
  input: { runtime: RuntimeMetrics; a11y: A11yViolation[]; security: SecurityFinding[] },
  thresholds: Thresholds
): Verdict;

export interface SubmissionResult { impl?: string; runtime: RuntimeMetrics; a11y: A11yViolation[]; security: SecurityFinding[]; verdict: Verdict }
export function summaryTable(results: Record<string, SubmissionResult>): string;

export function renderHtmlReport(report: { task: string; trace: string; traceSeed: number; generated: string; node: string; results: Record<string, SubmissionResult> }): string;
