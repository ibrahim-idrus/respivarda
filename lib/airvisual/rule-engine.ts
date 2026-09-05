import type { AqiCategory, NormalizedAirQuality, RespivardaAction, RespivardaStatus, RuleEngineInput, RuleEngineResult } from './types';

function getStatusAction(aqi: number): { status: RespivardaStatus; action: RespivardaAction; severity: number; category: AqiCategory } {
  if (aqi <= 50) return { status: 'NORMAL', action: 'Information', severity: 0, category: 'GOOD' };
  if (aqi <= 100) return { status: 'CAUTION', action: 'Insight + Recommendation', severity: 1, category: 'MODERATE' };
  if (aqi <= 150) return { status: 'WARNING', action: 'Proactive Alert', severity: 2, category: 'UNHEALTHY_SENSITIVE' };
  if (aqi <= 200) return { status: 'HIGH', action: 'Priority Alert', severity: 3, category: 'UNHEALTHY' };
  if (aqi <= 300) return { status: 'VERY_HIGH', action: 'High Priority Alert', severity: 4, category: 'VERY_UNHEALTHY' };
  return { status: 'CRITICAL', action: 'Critical Alert', severity: 5, category: 'HAZARDOUS' };
}

export function evaluateRuleEngine(input: RuleEngineInput): RuleEngineResult {
  const { current, previous, lastAlertAt, now = new Date(), cooldownMinutes = 60 } = input;
  const mapped = getStatusAction(current.usAqi);

  const currentSeverity = mapped.severity;
  const previousSeverity = previous ? getStatusAction(previous.usAqi).severity : currentSeverity;

  const comparison: RuleEngineResult['comparison'] =
    currentSeverity > previousSeverity ? 'increased' : currentSeverity < previousSeverity ? 'decreased' : 'no_change';

  const persistent = !previous || current.aqiCategory === previous.aqiCategory;

  let alertDecision: RuleEngineResult['alertDecision'] = 'trigger';
  let reason = 'Initial state';

  if (!persistent) {
    alertDecision = 'suppress';
    reason = 'Avoid unnecessary alert: condition not persistent';
  } else if (comparison === 'increased') {
    alertDecision = 'trigger';
    reason = 'Escalation: severity increased';
  } else if (comparison === 'decreased') {
    if (persistent) {
      alertDecision = 'trigger';
      reason = 'Recovery: severity decreased';
    } else {
      alertDecision = 'suppress';
      reason = 'Keep previous state: recovery not confirmed';
    }
  } else {
    const last = lastAlertAt ? lastAlertAt.getTime() : 0;
    const elapsedMinutes = (now.getTime() - last) / 60_000;
    if (lastAlertAt && elapsedMinutes < cooldownMinutes) {
      alertDecision = 'suppress';
      reason = `Cooldown: ${Math.ceil(cooldownMinutes - elapsedMinutes)}m remaining`;
    } else {
      alertDecision = currentSeverity === 0 ? 'suppress' : 'trigger';
      reason = currentSeverity === 0 ? 'No alert for NORMAL' : 'Condition persistent, cooldown passed';
    }
  }

  if (lastAlertAt) {
    const elapsedMinutes = (now.getTime() - lastAlertAt.getTime()) / 60_000;
    if (elapsedMinutes < cooldownMinutes && alertDecision === 'trigger' && comparison === 'no_change') {
      alertDecision = 'suppress';
      reason = `Cooldown: ${Math.ceil(cooldownMinutes - elapsedMinutes)}m remaining`;
    }
  }

  return {
    status: mapped.status,
    action: mapped.action,
    severity: mapped.severity,
    category: mapped.category,
    persistent,
    comparison,
    alertDecision,
    reason
  };
}
