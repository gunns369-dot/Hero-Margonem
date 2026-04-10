class HeroRouteCombatFSM {
  constructor(initial = {}) {
    this.state = {
      running: false,
      currentTask: 'IDLE',
      inRouteMap: false,
      berserkCheckbox: false,
      berserkActive: false,
      trapDetected: false,
      trapSolveStarted: false,
      fullscreenByBot: false,
      ...initial
    };
    this.events = [];
    this.attackCalls = 0;
  }

  log(event, payload = {}) {
    this.events.push({ event, ...payload });
  }

  shouldEnableBerserk() {
    return !!(this.state.running && this.state.currentTask === 'EXP' && this.state.inRouteMap && this.state.berserkCheckbox);
  }

  syncBerserk(reason = 'sync') {
    const shouldEnable = this.shouldEnableBerserk();
    if (shouldEnable && !this.state.berserkActive) {
      this.state.berserkActive = true;
      this.log('berserk_on', { reason });
      return;
    }
    if (!shouldEnable && this.state.berserkActive) {
      this.state.berserkActive = false;
      this.log('berserk_off', { reason });
    }
  }

  setRunning(v, reason = 'route') {
    this.state.running = !!v;
    if (!v) {
      this.state.currentTask = 'IDLE';
      this.state.inRouteMap = false;
    }
    this.log(v ? 'route_start' : 'route_stop', { reason });
    this.syncBerserk(reason);
  }

  setTask(task) {
    this.state.currentTask = task;
    this.log('task_change', { task });
    this.syncBerserk('task_change');
  }

  onMapChange(isInRouteMap) {
    this.state.inRouteMap = !!isInRouteMap;
    this.log('map_change', { isInRouteMap: !!isInRouteMap });
    this.syncBerserk('map_change');
  }

  setCheckbox(v) {
    this.state.berserkCheckbox = !!v;
    this.syncBerserk('checkbox');
  }

  detectTrap() {
    this.state.trapDetected = true;
    this.log('trap_detected');
  }

  beforeFirstTrapAction() {
    if (this.state.trapSolveStarted) return;
    this.state.trapSolveStarted = true;
    if (!this.state.fullscreenByBot) {
      this.state.fullscreenByBot = true;
      this.log('fullscreen_on');
    }
  }

  onTrapResolvedAndMovementResumed() {
    this.state.trapDetected = false;
    this.state.trapSolveStarted = false;
    if (this.state.fullscreenByBot) {
      this.state.fullscreenByBot = false;
      this.log('fullscreen_off');
    }
  }

  detectManualBerserkState(active) {
    this.state.berserkActive = !!active;
    this.log('manual_detect', { active: !!active });
    this.syncBerserk('manual_detect');
  }

  autoAttack() {
    if (!this.state.berserkActive) {
      this.log('attack_suppressed');
      return false;
    }
    this.attackCalls += 1;
    return true;
  }
}

module.exports = { HeroRouteCombatFSM };
