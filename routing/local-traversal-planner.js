const { SubgraphPlanner } = require('./subgraph-planner');

class LocalTraversalPlanner extends SubgraphPlanner {
  findPathWithinArea({ startKey, targetStateKey, chainGroupId }) {
    return this.buildSubroute({ startKey, targetKey: targetStateKey, chainGroupId });
  }

  findAlternativeExitSequence({ startKey, candidateTargets = [], chainGroupId }) {
    for (const targetStateKey of candidateTargets) {
      const sequence = this.buildSubroute({ startKey, targetKey: targetStateKey, chainGroupId });
      if (sequence) return { sequence, newStateKey: targetStateKey };
    }
    return null;
  }
}

module.exports = { LocalTraversalPlanner };
