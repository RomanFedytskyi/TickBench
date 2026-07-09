// Config-driven regulated-grade verdict. Thresholds come from the task's oracle.config.json
// so that acceptance criteria are part of the task definition, not the harness.
export function computeVerdict({ runtime, a11y, security }, thresholds) {
  const highSec = security.filter(f => f.severity === 'high').length;
  const v = {
    functional_final_state: runtime.finalValueErrors === 0 && runtime.finalFormatErrors <= (thresholds.finalErrorsMax ?? 0),
    staleness: runtime.catchUpMs.p95 !== null && runtime.catchUpMs.p95 < thresholds.catchUpP95Ms
      && runtime.staleCellFramePct !== null && runtime.staleCellFramePct < thresholds.staleCellFramePctMax,
    frame_stability: runtime.longFramePct !== null && runtime.longFramePct < thresholds.longFramePctMax,
    security: !runtime.xssTriggered && highSec <= (thresholds.highSecurityFindingsMax ?? 0),
    accessibility: a11y.length <= (thresholds.axeViolationsMax ?? 0),
    no_runtime_error: runtime.implError === null
  };
  v.regulated_grade_pass = Object.values(v).every(Boolean);
  return v;
}
