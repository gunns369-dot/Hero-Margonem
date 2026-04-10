class HeroRouteCombatFSM {
  constructor(initial = {}) {
    this.state = {
      onExpMap: false,
      routeStarted: false,
      berserkCheckbox: false,
      outOfRoute: true,
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
    return !!(this.state.onExpMap && this.state.routeStarted && this.state.berserkCheckbox && !this.state.outOfRoute);
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

  setRouteStarted(v, reason = 'route') {
    this.state.routeStarted = !!v;
    this.log(v ? 'route_start' : 'route_stop', { reason });
    if (!v) this.state.outOfRoute = true;
    this.syncBerserk(reason);
  }

  onMapChange(isExpMap) {
    this.state.onExpMap = !!isExpMap;
    this.state.outOfRoute = !isExpMap;
    this.log('map_change', { isExpMap: !!isExpMap });
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
