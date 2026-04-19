function buildRouteDebugDump({ routeStates = [], activeSubroute = [], rejectedEdges = [], loopEvents = [] } = {}) {
  return {
    route_states: routeStates.map((key, index) => ({ index, identity_key: key })),
    active_subplan: [...activeSubroute],
    rejected_candidate_edges: [...rejectedEdges],
    loop_diagnostics: [...loopEvents]
  };
}

module.exports = { buildRouteDebugDump };
