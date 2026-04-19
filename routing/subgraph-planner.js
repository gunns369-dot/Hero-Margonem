class SubgraphPlanner {
  constructor(graph, { logger } = {}) {
    this.graph = graph;
    this.logger = logger;
    this.unreachable = new Set();
  }

  markUnreachable(transitionKey) {
    this.unreachable.add(transitionKey);
  }

  buildSubroute({ startKey, targetKey, chainGroupId }) {
    const queue = [[startKey]];
    const seen = new Set([startKey]);

    while (queue.length) {
      const path = queue.shift();
      const current = path[path.length - 1];
      if (current === targetKey) {
        this.logger?.emit('SUBROUTE_BUILT', { current_state_key: startKey, expected_next_state: path[1] || null, chain_depth: path.length, reason: chainGroupId || 'direct' });
        return path;
      }

      for (const edge of this.graph.getOutgoingEdges(current)) {
        const id = `${edge.source}=>${edge.target}`;
        if (this.unreachable.has(id)) continue;
        if (chainGroupId && edge.chain_group_id && edge.chain_group_id !== chainGroupId) continue;
        if (seen.has(edge.target)) continue;
        seen.add(edge.target);
        queue.push([...path, edge.target]);
      }
    }

    return null;
  }
}

module.exports = { SubgraphPlanner };
