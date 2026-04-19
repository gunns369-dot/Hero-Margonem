class RepairEngine {
  constructor({ graph, globalPlanner, subgraphPlanner, logger }) {
    this.graph = graph;
    this.globalPlanner = globalPlanner;
    this.subgraphPlanner = subgraphPlanner;
    this.logger = logger;
  }

  repair({ level, currentState, expectedNextState, goalArea, chainGroupId }) {
    if (level === 'repair_level_1') {
      this.logger?.emit('LOCAL_REPAIR_TRIGGERED', { current_state_key: currentState, expected_next_state: expectedNextState, repair_level: 1, reason: 'same_location_correction' });
      const direct = this.graph.getOutgoingEdges(currentState).find(e => e.target === expectedNextState);
      return direct ? { repaired: true, plan: [currentState, expectedNextState], level } : { repaired: false, level };
    }

    if (level === 'repair_level_2') {
      this.logger?.emit('LOCAL_REPAIR_TRIGGERED', { current_state_key: currentState, expected_next_state: expectedNextState, repair_level: 2, reason: 'chain_subgraph_repair' });
      const subroute = this.subgraphPlanner.buildSubroute({ startKey: currentState, targetKey: expectedNextState, chainGroupId });
      return subroute ? { repaired: true, plan: subroute, level } : { repaired: false, level };
    }

    this.logger?.emit('GLOBAL_REPLAN_TRIGGERED', { current_state_key: currentState, repair_level: 3, reason: 'local_repair_failed' });
    const replanned = this.globalPlanner.plan({ startState: currentState, goalArea });
    return replanned.states ? { repaired: true, plan: replanned.states, level: 'repair_level_3' } : { repaired: false, level: 'repair_level_3' };
  }
}

module.exports = { RepairEngine };
