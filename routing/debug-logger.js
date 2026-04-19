class RouteDebugLogger {
  constructor({ enabled = false } = {}) {
    this.enabled = enabled;
    this.events = [];
  }

  emit(event, payload = {}) {
    const normalized = {
      event,
      current_state_key: payload.current_state_key ?? null,
      expected_next_state: payload.expected_next_state ?? null,
      current_stage: payload.current_stage ?? null,
      repair_level: payload.repair_level ?? 0,
      chain_depth: payload.chain_depth ?? 0,
      reason: payload.reason ?? null,
      ...payload
    };
    this.events.push(normalized);
    if (this.enabled) {
      // eslint-disable-next-line no-console
      console.log(`[ROUTE] ${event}`, normalized);
    }
  }

  getEventsByType(type) {
    return this.events.filter(e => e.event === type);
  }
}

module.exports = { RouteDebugLogger };
