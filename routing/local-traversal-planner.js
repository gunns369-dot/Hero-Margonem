class LocalTraversalPlanner {
  constructor(graph, { logger } = {}) {
    this.graph = graph;
    this.logger = logger;
    this.unreachableEdges = new Set();
  }

  markUnreachable(edgeId) {
    this.unreachableEdges.add(edgeId);
    this.logger?.emit('LOCAL_EXIT_UNREACHABLE', { edgeId });
  }

  findPathWithinArea({ startKey, targetExitId, areaName }) {
    const queue = [[startKey]];
    const seen = new Set([startKey]);

    while (queue.length) {
      const path = queue.shift();
      const current = path[path.length - 1];
      const node = this.graph.getNode(current);
      if (!node) continue;

      if (node.areaName === areaName && node.exitId === targetExitId) return path;

      for (const edge of this.graph.getOutgoingEdges(current)) {
        const edgeId = `${edge.source}=>${edge.target}`;
        if (this.unreachableEdges.has(edgeId)) continue;

        const nextNode = this.graph.getNode(edge.target);
        if (!nextNode) continue;
        const isLocalTransit =
          nextNode.areaName === areaName ||
          ['interior', 'connector', 'transition_segment'].includes(nextNode.areaType);

        if (!isLocalTransit || seen.has(edge.target)) continue;
        seen.add(edge.target);
        queue.push([...path, edge.target]);
      }
    }

    return null;
  }

  findAlternativeExitSequence({ startKey, desiredAreaName, blockedExitId }) {
    const startNode = this.graph.getNode(startKey);
    if (!startNode) return null;

    for (const stateKey of this.graph.findStateKeysByArea(desiredAreaName)) {
      const state = this.graph.getNode(stateKey);
      if (!state || state.exitId === blockedExitId) continue;
      const seq = this.findPathWithinArea({ startKey, targetExitId: state.exitId, areaName: desiredAreaName });
      if (seq) return { sequence: seq, newExitId: state.exitId };
    }

    return null;
  }
}

module.exports = {
  LocalTraversalPlanner
};
