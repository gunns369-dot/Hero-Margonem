const STATES = Object.freeze({
  IDLE: 'IDLE',
  ROAM: 'ROAM',
  TASK_ACTIVE: 'TASK_ACTIVE',
  EMERGENCY_ESCAPE: 'EMERGENCY_ESCAPE',
  SAFE_RECOVERY: 'SAFE_RECOVERY',
  RESUME_TASK: 'RESUME_TASK'
});

class AgentStateController {
  constructor(config = {}) {
    this.config = {
      dangerLostTimeoutMs: config.dangerLostTimeoutMs ?? 5000
    };

    this.state = STATES.IDLE;
    this.prevStateBeforeEmergency = STATES.IDLE;
    this.currentPlan = [];
    this.currentTarget = null;
    this.routeProgress = null;
    this.modeConfig = {};
    this.escapePath = [];
    this.escapeTarget = null;

    this.flags = {
      danger_detected: false,
      danger_lost_timeout: this.config.dangerLostTimeoutMs,
      current_task_snapshot: null,
      resume_allowed: false,
      ignore_regular_targets_while_escape: false,
      suppress_combat_or_interaction_during_escape: false
    };

    this.events = [];
    this.lastDangerSeenAt = null;
  }

  log(event, payload = {}) {
    this.events.push({ event, ...payload });
  }

  setState(nextState, payload = {}) {
    if (this.state === nextState) return;
    const from = this.state;
    this.state = nextState;
    this.log('STATE_CHANGE', { from, to: nextState, ...payload });
  }

  setTaskContext({ plan, target, routeProgress, modeConfig } = {}) {
    if (Array.isArray(plan)) this.currentPlan = [...plan];
    if (target !== undefined) this.currentTarget = target;
    if (routeProgress !== undefined) this.routeProgress = routeProgress;
    if (modeConfig !== undefined) this.modeConfig = { ...modeConfig };

    if (this.state === STATES.IDLE) {
      if (this.currentTarget || this.currentPlan.length) this.setState(STATES.TASK_ACTIVE, { reason: 'task_context_loaded' });
      else this.setState(STATES.ROAM, { reason: 'roam_context_loaded' });
    }
  }

  enterEmergency({ safeExits = [], now = Date.now(), dangerSource = 'unknown' } = {}) {
    if (this.state === STATES.EMERGENCY_ESCAPE) {
      this.flags.danger_detected = true;
      this.lastDangerSeenAt = now;
      this.log('DANGER_STILL_ACTIVE', { reason: 'already_in_escape', dangerSource });
      return;
    }

    this.flags.danger_detected = true;
    this.lastDangerSeenAt = now;
    this.prevStateBeforeEmergency = this.state;
    this.flags.current_task_snapshot = {
      previousState: this.state,
      plan: [...this.currentPlan],
      target: this.currentTarget,
      routeProgress: this.routeProgress,
      modeConfig: { ...this.modeConfig }
    };

    // Freeze normal activity while escaping.
    this.currentPlan = [];
    this.currentTarget = null;
    this.flags.resume_allowed = false;
    this.flags.ignore_regular_targets_while_escape = true;
    this.flags.suppress_combat_or_interaction_during_escape = true;

    this.log('ENTER_EMERGENCY_ESCAPE', { dangerSource });
    this.pickEscapeTarget(safeExits);
    this.setState(STATES.EMERGENCY_ESCAPE, { reason: 'danger_detected' });
  }

  pickEscapeTarget(safeExits = []) {
    if (!safeExits.length) {
      this.escapeTarget = null;
      this.escapePath = [];
      this.log('ESCAPE_TARGET_SELECTED', { selected: null, reason: 'no_safe_exits' });
      return;
    }

    const nearest = safeExits.reduce((best, current) => {
      if (!best) return current;
      return current.distance < best.distance ? current : best;
    }, null);

    this.escapeTarget = nearest.id;
    this.escapePath = Array.isArray(nearest.path) ? [...nearest.path] : [];
    this.log('ESCAPE_TARGET_SELECTED', {
      selected: nearest.id,
      distance: nearest.distance
    });
  }

  getNextTarget() {
    if (this.state === STATES.EMERGENCY_ESCAPE && this.flags.ignore_regular_targets_while_escape) {
      return { type: 'escape', target: this.escapeTarget, path: [...this.escapePath] };
    }

    return { type: 'regular', target: this.currentTarget, plan: [...this.currentPlan] };
  }

  onEscapePathBlocked({ safeExits = [] } = {}) {
    if (this.state !== STATES.EMERGENCY_ESCAPE) return;
    this.pickEscapeTarget(safeExits);
    this.log('ESCAPE_PATH_RECALCULATED', { reason: 'path_blocked', target: this.escapeTarget });
  }

  onSaferExitFound({ safeExits = [] } = {}) {
    if (this.state !== STATES.EMERGENCY_ESCAPE || !safeExits.length) return;

    const currentDistance = safeExits.find(e => e.id === this.escapeTarget)?.distance ?? Number.POSITIVE_INFINITY;
    const nearest = safeExits.reduce((best, current) => (current.distance < best.distance ? current : best));

    if (nearest.distance < currentDistance) {
      this.escapeTarget = nearest.id;
      this.escapePath = Array.isArray(nearest.path) ? [...nearest.path] : [];
      this.log('ESCAPE_PATH_RECALCULATED', { reason: 'closer_exit_found', target: nearest.id, distance: nearest.distance });
    }
  }

  tick({ dangerVisible, now = Date.now(), safeExits = [] } = {}) {
    if (dangerVisible) {
      if (this.state !== STATES.EMERGENCY_ESCAPE) {
        this.enterEmergency({ safeExits, now, dangerSource: 'sensor_tick' });
      } else {
        this.flags.danger_detected = true;
        this.lastDangerSeenAt = now;
        this.log('DANGER_STILL_ACTIVE');
      }
      return;
    }

    if (this.state !== STATES.EMERGENCY_ESCAPE) return;

    if (!this.lastDangerSeenAt) this.lastDangerSeenAt = now;
    const elapsed = now - this.lastDangerSeenAt;
    if (elapsed < this.flags.danger_lost_timeout) {
      this.log('DANGER_STILL_ACTIVE', { elapsed });
      return;
    }

    this.flags.danger_detected = false;
    this.flags.resume_allowed = true;
    this.flags.ignore_regular_targets_while_escape = false;
    this.flags.suppress_combat_or_interaction_during_escape = false;
    this.setState(STATES.SAFE_RECOVERY, { reason: 'danger_timeout_elapsed', elapsed });
    this.log('DANGER_CLEARED', { elapsed });
    this.resumePreviousTask();
  }

  resumePreviousTask() {
    if (!this.flags.resume_allowed || !this.flags.current_task_snapshot) {
      this.setState(STATES.ROAM, { reason: 'resume_not_available' });
      return;
    }

    const snapshot = this.flags.current_task_snapshot;
    this.currentPlan = [...snapshot.plan];
    this.currentTarget = snapshot.target;
    this.routeProgress = snapshot.routeProgress;
    this.modeConfig = { ...snapshot.modeConfig };

    this.setState(STATES.RESUME_TASK, { reason: 'restore_snapshot' });
    this.log('RESUME_PREVIOUS_TASK', {
      previousState: snapshot.previousState,
      restoredTarget: snapshot.target
    });

    const restoredState = snapshot.previousState || STATES.ROAM;
    this.setState(restoredState, { reason: 'resume_complete' });

    this.flags.current_task_snapshot = null;
    this.flags.resume_allowed = false;
  }

  shouldSuppressCombatOrInteraction() {
    return this.state === STATES.EMERGENCY_ESCAPE && this.flags.suppress_combat_or_interaction_during_escape;
  }
}

module.exports = {
  STATES,
  AgentStateController
};
