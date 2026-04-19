class RouteReplanner {
  constructor({ globalPlanner, localPlanner, logger }) {
    this.globalPlanner = globalPlanner;
    this.localPlanner = localPlanner;
    this.logger = logger;
  }

  onLocalTraversalFailure({ failedEdge, currentState, goalArea }) {
    this.localPlanner.markUnreachable(failedEdge);

    const [source, target] = failedEdge.split('=>');
    const sourceNode = this.globalPlanner.graph.getNode(source);
    const targetNode = this.globalPlanner.graph.getNode(target);

    if (sourceNode && targetNode && sourceNode.areaName === targetNode.areaName) {
      const alternative = this.localPlanner.findAlternativeExitSequence({
        startKey: currentState,
        desiredAreaName: sourceNode.areaName,
        blockedExitId: targetNode.exitId
      });
      if (alternative) {
        this.logger?.emit('CONNECTOR_PATH_DISCOVERED', {
          reason: 'local_exit_fallback',
          area: sourceNode.areaName,
          sequence: alternative.sequence
        });
      }
    }

    this.globalPlanner.blockEdge({ source, target });
    this.logger?.emit('GLOBAL_REPLAN', { failedEdge, currentState, goalArea });
    return this.globalPlanner.plan({ startState: currentState, goalArea });
  }
}

module.exports = {
  RouteReplanner
};
