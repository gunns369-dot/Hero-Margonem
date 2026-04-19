const { ROUTE_STAGES, stateIdentityKey, transitionIdentityKey } = require('./state-model');
const { TransitionContext } = require('./transition-context');
const { SemanticLoopDetector } = require('./loop-detection');
const { SubgraphPlanner } = require('./subgraph-planner');
const { buildRouteDebugDump } = require('./debug-tools');

const TYPE_COST = { outer: 1, interior: 1.4, room: 1.4, corridor: 1.2, connector: 1.2, transition: 1.1 };

class GlobalRoutePlanner {
  constructor(graph, { logger } = {}) {
    this.graph = graph;
    this.logger = logger;
    this.loopDetector = new SemanticLoopDetector({ logger });
    this.subgraphPlanner = new SubgraphPlanner(graph, { logger });
    this.blockedTransitions = new Set();
  }

  blockEdge(edge) { this.blockedTransitions.add(`${edge.source}=>${edge.target}`); }
  unblockAll() { this.blockedTransitions.clear(); }

  plan({ startState, goalArea, goalStateKey }) {
    const startKey = typeof startState === 'string' ? startState : stateIdentityKey(startState);
    const frontier = [{ key: startKey, f: 0 }];
    const g = new Map([[startKey, 0]]);
    const parent = new Map();
    const visitedHistory = [];
    const rejectedEdges = [];
    const loopEvents = [];

    const context = new TransitionContext({ from_state_key: startKey, high_level_goal: goalArea || goalStateKey });
    this.logger?.emit('ROUTE_PLAN_START', { current_state_key: startKey, reason: 'global_plan_started', current_stage: ROUTE_STAGES.GLOBAL_APPROACH });

    while (frontier.length) {
      frontier.sort((a, b) => a.f - b.f);
      const current = frontier.shift().key;
      const currentNode = this.graph.getNode(current);
      if (!currentNode) continue;

      if ((goalStateKey && current === goalStateKey) || (!goalStateKey && currentNode.area_name === goalArea)) {
        const states = this.#reconstruct(parent, current);
        const stages = this.#deriveStages(states);
        this.logger?.emit('ROUTE_PLAN_SUCCESS', { current_state_key: current, current_stage: stages[stages.length - 1], chain_depth: context.traversed_connector_nodes.length });
        return {
          states,
          active_route_plan: states,
          active_subroute_plan: this.#extractSubroute(states),
          current_plan_index: 0,
          expected_next_state: states[1] || null,
          transition_context: context,
          route_stages: stages,
          debug_dump: buildRouteDebugDump({ routeStates: states, activeSubroute: this.#extractSubroute(states), rejectedEdges, loopEvents })
        };
      }

      visitedHistory.push(current);
      for (const edge of this.graph.getOutgoingEdges(current)) {
        const edgeKey = `${edge.source}=>${edge.target}`;
        if (this.blockedTransitions.has(edgeKey)) {
          rejectedEdges.push({ edge: edgeKey, reason: 'blocked' });
          continue;
        }

        const next = edge.target;
        const nextNode = this.graph.getNode(next);
        if (!nextNode) continue;

        const loop = this.loopDetector.evaluate({ history: visitedHistory, candidate: next, candidateState: nextNode });
        loopEvents.push({ candidate: next, ...loop });
        if (loop.rejected) {
          rejectedEdges.push({ edge: edgeKey, reason: loop.reason });
          continue;
        }

        const transitionKey = transitionIdentityKey(edge);
        const progressBias = edge.chain_group_id ? -0.3 : 0;
        const loopPenalty = loop.legal_reentry ? 0.5 : 0;
        const noProgressPenalty = visitedHistory.includes(next) ? 3 : 0;
        const moveCost = (edge.cost ?? 1) + (TYPE_COST[nextNode.area_instance_type] ?? 1.3) + loopPenalty + noProgressPenalty + progressBias;
        const tentative = (g.get(current) ?? Infinity) + moveCost;
        if (tentative >= (g.get(next) ?? Infinity)) continue;

        parent.set(next, current);
        g.set(next, tentative);
        if (edge.is_connector) context.registerConnector(next);
        frontier.push({ key: next, f: tentative + this.#heuristic(nextNode, goalArea, edge) });

        const stage = this.#stageForNode(nextNode, edge);
        this.logger?.emit('GLOBAL_STAGE_SELECTED', {
          current_state_key: next,
          expected_next_state: null,
          current_stage: stage,
          chain_depth: context.traversed_connector_nodes.length,
          reason: transitionKey
        });
      }
    }

    this.logger?.emit('ROUTE_PLAN_FAILED', { current_state_key: startKey, reason: 'no_reachable_goal', current_stage: ROUTE_STAGES.GLOBAL_APPROACH });
    return { states: null, debug_dump: buildRouteDebugDump({ rejectedEdges, loopEvents }) };
  }

  #heuristic(node, goalArea, edge) {
    if (!goalArea) return 0;
    let score = node.area_name === goalArea ? 0 : 1;
    if (edge?.chain_group_id) score += 0.2;
    if (node.area_instance_type === 'connector') score += 0.1;
    return score;
  }

  #extractSubroute(states) {
    return states.filter(s => {
      const n = this.graph.getNode(s);
      return n && ['interior', 'room', 'corridor', 'connector', 'transition'].includes(n.area_instance_type);
    });
  }

  #deriveStages(states) {
    return states.map((key, i) => {
      const node = this.graph.getNode(key);
      const prev = i > 0 ? this.graph.getNode(states[i - 1]) : null;
      if (!prev) return ROUTE_STAGES.GLOBAL_APPROACH;
      if (node.area_instance_type === 'outer' && prev.area_instance_type !== 'outer') return ROUTE_STAGES.RETURN_TO_OUTER_GRAPH;
      if (['interior', 'room', 'corridor', 'connector', 'transition'].includes(node.area_instance_type)) {
        return ['interior', 'room', 'corridor'].includes(node.area_instance_type)
          ? ROUTE_STAGES.TRAVERSE_INTERIOR_CHAIN
          : ROUTE_STAGES.ENTER_SUBGRAPH;
      }
      return i === states.length - 1 ? ROUTE_STAGES.FINAL_APPROACH : ROUTE_STAGES.GLOBAL_APPROACH;
    });
  }

  #stageForNode(node, edge) {
    if (edge?.topology_effect === 'exit_chain') return ROUTE_STAGES.EXIT_SUBGRAPH;
    if (['interior', 'room', 'corridor'].includes(node.area_instance_type)) return ROUTE_STAGES.TRAVERSE_INTERIOR_CHAIN;
    if (['connector', 'transition'].includes(node.area_instance_type)) return ROUTE_STAGES.ENTER_SUBGRAPH;
    return ROUTE_STAGES.GLOBAL_APPROACH;
  }

  #reconstruct(parent, current) {
    const path = [current];
    while (parent.has(current)) {
      current = parent.get(current);
      path.push(current);
    }
    return path.reverse();
  }
}

module.exports = { GlobalRoutePlanner };
