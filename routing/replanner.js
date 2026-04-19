class RouteReplanner {
  constructor({ globalPlanner, repairEngine, logger }) {
    this.globalPlanner = globalPlanner;
    this.repairEngine = repairEngine;
    this.logger = logger;
  }

  onLocalTraversalFailure({ failedEdge, currentState, goalArea }) {
    const [source, target] = failedEdge.split('=>');
    this.globalPlanner.blockEdge({ source, target });
    this.logger?.emit('LOCAL_REPAIR_TRIGGERED', {
      current_state_key: currentState,
      expected_next_state: target,
      repair_level: 2,
      reason: 'edge_failed'
    });

    const repaired = this.repairEngine.repair({
      level: 'repair_level_3',
      currentState,
      expectedNextState: target,
      goalArea
    });

    return repaired.repaired ? { states: repaired.plan } : { states: null };
  }
}

module.exports = { RouteReplanner };
