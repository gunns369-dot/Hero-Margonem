const { RouteGraph } = require('./graph-model');

function loadTransitionGraph(definition = {}) {
  const graph = new RouteGraph();
  const transitions = definition.transitions || [];

  for (const t of transitions) {
    graph.addEdge(
      {
        areaName: t.source.area,
        stateId: t.source.state_id,
        entryId: t.source.entry_id,
        exitId: t.source.exit_id,
        startZone: t.source.start_zone,
        areaType: t.source.area_type,
        traversalContext: t.source.traversal_context
      },
      {
        areaName: t.target.area,
        stateId: t.target.state_id,
        entryId: t.target.entry_id,
        exitId: t.target.exit_id,
        startZone: t.target.start_zone,
        areaType: t.target.area_type,
        traversalContext: t.target.traversal_context
      },
      {
        source_exit_id: t.source_exit_id,
        target_entry_id: t.target_entry_id,
        position: t.position,
        standPosition: t.stand_position,
        tags: t.tags,
        constraints: t.constraints,
        oneWay: t.direction === 'one_way',
        weight: t.weight,
        debugLabel: t.id
      }
    );
  }

  return graph;
}

module.exports = {
  loadTransitionGraph
};
