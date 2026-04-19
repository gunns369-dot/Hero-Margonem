class RouteDebugLogger {
  constructor({ enabled = false } = {}) {
    this.enabled = enabled;
    this.events = [];
  }

  emit(event, payload = {}) {
    const entry = { event, ...payload };
    this.events.push(entry);
    if (this.enabled) {
      // eslint-disable-next-line no-console
      console.log(`[ROUTE] ${event}`, payload);
    }
  }

  getEventsByType(type) {
    return this.events.filter(e => e.event === type);
  }
}

module.exports = {
  RouteDebugLogger
};
