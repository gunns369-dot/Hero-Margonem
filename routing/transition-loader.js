const { RouteGraph } = require('./graph-model');

function loadTransitionGraph(definition = {}) {
  const graph = new RouteGraph();

  for (const t of (definition.transitions || [])) {
    graph.addEdge(
      {
        area_name: t.source.area,
        state_id: t.source.state_id,
        entry_id: t.source.entry_id,
        exit_id: t.source.exit_id,
        zone_id: t.source.zone_id || t.source.start_zone,
        area_instance_type: t.source.area_type || 'outer',
        reachable_exits: t.source.reachable_exits,
        parent_transition_context: t.source.traversal_context
      },
      {
        area_name: t.target.area,
        state_id: t.target.state_id,
        entry_id: t.target.entry_id,
        exit_id: t.target.exit_id,
        zone_id: t.target.zone_id || t.target.start_zone,
        area_instance_type: t.target.area_type || 'outer',
        reachable_exits: t.target.reachable_exits,
        parent_transition_context: t.target.traversal_context
      },
      {
        transition_type: t.transition_type || (t.tags || []).join(',') || 'walk',
        source_state_pattern: t.source_state_pattern,
        target_state_pattern: t.target_state_pattern,
        entry_anchor: t.entry_anchor || t.source.entry_id,
        exit_anchor: t.exit_anchor || t.target.exit_id,
        bidirectional: t.bidirectional ?? t.direction !== 'one_way',
        oneWay: t.direction === 'one_way',
        cost: t.cost ?? t.weight,
        is_connector: t.is_connector,
        chain_group_id: t.chain_group_id,
        topology_effect: t.topology_effect,
        tags: t.tags,
        debugLabel: t.id
      }
    );
  }

  return graph;
}

module.exports = { loadTransitionGraph };
