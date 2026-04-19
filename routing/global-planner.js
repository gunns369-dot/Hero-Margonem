const { stateKey, topologicalSignature } = require('./state-identity');

const AREA_TYPE_COST = {
  outer_area: 1,
  interior: 2,
  connector: 2,
  transition_segment: 2
};

function defaultHeuristic() {
  return 0;
}

class GlobalRoutePlanner {
  constructor(graph, { logger, heuristic = defaultHeuristic } = {}) {
    this.graph = graph;
    this.logger = logger;
    this.heuristic = heuristic;
    this.blockedEdges = new Set();
  }

  blockEdge(edge) {
    this.blockedEdges.add(`${edge.source}=>${edge.target}`);
  }

  unblockAll() {
    this.blockedEdges.clear();
  }

  plan({ startState, goalArea, goalStateKey }) {
    const startKey = typeof startState === 'string' ? startState : stateKey(startState);
    this.logger?.emit('ROUTE_PLAN_START', { startKey, goalArea, goalStateKey });

    const frontier = [{ key: startKey, f: 0 }];
    const gScore = new Map([[startKey, 0]]);
    const cameFrom = new Map();
    const visited = new Set();
    const signatureCount = new Map();
    const rejectReasons = [];

    while (frontier.length) {
      frontier.sort((a, b) => a.f - b.f);
      const current = frontier.shift().key;
      const currentNode = this.graph.getNode(current);

      if (!currentNode) continue;
      if (visited.has(current)) continue;
      visited.add(current);

      this.logger?.emit('ROUTE_NODE_EXPANDED', { key: current, area: currentNode.areaName });

      if ((goalStateKey && current === goalStateKey) || (!goalStateKey && currentNode.areaName === goalArea)) {
        const states = this.#reconstructPath(cameFrom, current);
        this.logger?.emit('ROUTE_PLAN_SUCCESS', { states });
        return { states, rejectReasons };
      }

      for (const edge of this.graph.getOutgoingEdges(current)) {
        const edgeId = `${edge.source}=>${edge.target}`;
        if (this.blockedEdges.has(edgeId)) {
          rejectReasons.push({ edge: edgeId, reason: 'temporarily_blocked' });
          continue;
        }
        if (!this.#isEdgeAllowed(edge)) {
          rejectReasons.push({ edge: edgeId, reason: 'constraints' });
          continue;
        }

        const next = edge.target;
        const nextNode = this.graph.getNode(next);
        if (!nextNode) continue;

        const signature = topologicalSignature(nextNode);
        const times = signatureCount.get(signature) || 0;
        const loopPenalty = times > 0 ? 10 * times : 0;
        const areaCost = AREA_TYPE_COST[nextNode.areaType] ?? 2;
        const transitionCost = (edge.weight ?? 1) + areaCost + loopPenalty;
        const tentative = gScore.get(current) + transitionCost;

        if (tentative >= (gScore.get(next) ?? Number.POSITIVE_INFINITY)) continue;

        if (nextNode.areaName === currentNode.areaName && signature !== topologicalSignature(currentNode)) {
          this.logger?.emit('REENTER_SAME_AREA_WITH_NEW_STATE', {
            area: nextNode.areaName,
            from: current,
            to: next
          });
        }

        if (nextNode.areaType === 'connector' || nextNode.areaType === 'transition_segment' || nextNode.areaType === 'interior') {
          this.logger?.emit('CONNECTOR_PATH_DISCOVERED', { via: next, areaType: nextNode.areaType });
        }

        cameFrom.set(next, current);
        gScore.set(next, tentative);
        signatureCount.set(signature, times + 1);
        frontier.push({ key: next, f: tentative + this.heuristic(nextNode, goalArea) });
      }
    }

    this.logger?.emit('ROUTE_PLAN_FAILED', { startKey, goalArea, goalStateKey, rejectReasons });
    return { states: null, rejectReasons };
  }

  #isEdgeAllowed(edge) {
    if (!edge.constraints) return true;
    if (typeof edge.constraints === 'function') return !!edge.constraints();
    if (typeof edge.constraints === 'object' && 'enabled' in edge.constraints) return !!edge.constraints.enabled;
    return true;
  }

  #reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      path.push(current);
    }
    return path.reverse();
  }
}

module.exports = {
  GlobalRoutePlanner
};
