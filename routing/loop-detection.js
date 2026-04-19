class SemanticLoopDetector {
  constructor({ logger } = {}) {
    this.logger = logger;
  }

  evaluate({ history = [], candidate, candidateState }) {
    const occurrences = history.filter(h => h === candidate).length;
    if (!occurrences) return { rejected: false, legal_reentry: false, reason: 'new_state' };

    const previous = history.find(h => h.split('|')[0] === candidateState.area_name);
    const prevParts = previous ? previous.split('|') : [];
    const zoneChanged = prevParts[5] !== (candidateState.zone_id || candidateState.anchor_position || '-');
    const entryChanged = prevParts[3] !== (candidateState.entry_id || '-');
    const topologyChanged = prevParts[7] !== candidateState.topology_hash;

    if (zoneChanged || entryChanged || topologyChanged) {
      this.logger?.emit('REENTER_SAME_AREA_NEW_TOPOLOGY', { candidate, reason: 'semantic_progress' });
      return { rejected: false, legal_reentry: true, reason: 'semantic_progress' };
    }

    this.logger?.emit('SEMANTIC_LOOP_REJECTED', { candidate, reason: 'same_topology_no_progress' });
    return { rejected: true, legal_reentry: false, reason: 'same_topology_no_progress' };
  }
}

module.exports = { SemanticLoopDetector };
