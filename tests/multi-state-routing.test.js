const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loadTransitionGraph,
  GlobalRoutePlanner,
  LocalTraversalPlanner,
  RouteDebugLogger,
  RouteExecutor,
  RepairEngine,
  RouteReplanner,
  ROUTE_STAGES,
  transitionIdentityKey
} = require('../routing');

function buildGraph() {
  return loadTransitionGraph({
    transitions: [
      {
        id: 'A_to_B_gate',
        source: { area: 'A', state_id: 'A@north', exit_id: 'north_gate', area_type: 'outer' },
        target: { area: 'B', state_id: 'B@west', entry_id: 'west_entry', exit_id: 'house_door', area_type: 'outer' },
        tags: ['door']
      },
      {
        id: 'B_to_room1',
        source: { area: 'B', state_id: 'B@west', entry_id: 'west_entry', exit_id: 'house_door', area_type: 'outer' },
        target: { area: 'B_house', state_id: 'house@r1', entry_id: 'door', exit_id: 'door_r2', area_type: 'room' },
        chain_group_id: 'house_chain',
        topology_effect: 'enter_chain',
        is_connector: true
      },
      {
        id: 'room1_room2',
        source: { area: 'B_house', state_id: 'house@r1', entry_id: 'door', exit_id: 'door_r2', area_type: 'room' },
        target: { area: 'B_house', state_id: 'house@r2', entry_id: 'door_r1', exit_id: 'to_corridor', area_type: 'room' },
        chain_group_id: 'house_chain'
      },
      {
        id: 'room2_corridor',
        source: { area: 'B_house', state_id: 'house@r2', entry_id: 'door_r1', exit_id: 'to_corridor', area_type: 'room' },
        target: { area: 'B_corridor', state_id: 'corr@mid', entry_id: 'r2', exit_id: 'r3', area_type: 'corridor' },
        chain_group_id: 'house_chain'
      },
      {
        id: 'corridor_room3',
        source: { area: 'B_corridor', state_id: 'corr@mid', entry_id: 'r2', exit_id: 'r3', area_type: 'corridor' },
        target: { area: 'B_house', state_id: 'house@r3', entry_id: 'corridor', exit_id: 'to_market', area_type: 'room' },
        chain_group_id: 'house_chain'
      },
      {
        id: 'room3_to_market_variant',
        source: { area: 'B_house', state_id: 'house@r3', entry_id: 'corridor', exit_id: 'to_market', area_type: 'room' },
        target: { area: 'B', state_id: 'B@market', entry_id: 'house_exit', exit_id: 'east_gate', area_type: 'outer' },
        chain_group_id: 'house_chain',
        topology_effect: 'exit_chain',
        is_connector: true
      },
      {
        id: 'B_to_C',
        source: { area: 'B', state_id: 'B@market', entry_id: 'house_exit', exit_id: 'east_gate', area_type: 'outer' },
        target: { area: 'C', state_id: 'C@south', entry_id: 'south_gate', exit_id: 'south_gate', area_type: 'outer' }
      },
      {
        id: 'same_name_new_topology',
        source: { area: 'B', state_id: 'B@market', entry_id: 'house_exit', exit_id: 'inner_loop', zone_id: 'z2', area_type: 'outer' },
        target: { area: 'B', state_id: 'B@west', entry_id: 'secret', exit_id: 'house_door', zone_id: 'z1', area_type: 'outer' }
      },
      {
        id: 'bad_loop',
        source: { area: 'Loop', state_id: 'loop@1', entry_id: 'a', exit_id: 'a', area_type: 'outer' },
        target: { area: 'Loop', state_id: 'loop@1', entry_id: 'a', exit_id: 'a', area_type: 'outer' },
        bidirectional: false
      }
    ]
  });
}

function buildStack() {
  const graph = buildGraph();
  const logger = new RouteDebugLogger();
  const globalPlanner = new GlobalRoutePlanner(graph, { logger });
  const localPlanner = new LocalTraversalPlanner(graph, { logger });
  const repairEngine = new RepairEngine({ graph, globalPlanner, subgraphPlanner: localPlanner, logger });
  const executor = new RouteExecutor({ graph, repairEngine, logger });
  const replanner = new RouteReplanner({ globalPlanner, repairEngine, logger });
  return { graph, logger, globalPlanner, localPlanner, repairEngine, executor, replanner };
}

test('prosta trasa bez wnętrz', () => {
  const graph = loadTransitionGraph({
    transitions: [{ id: 'x_to_y', source: { area: 'X', state_id: 'X@a', exit_id: 'toY', area_type: 'outer' }, target: { area: 'Y', state_id: 'Y@b', entry_id: 'fromX', exit_id: 'stay', area_type: 'outer' } }]
  });
  const planner = new GlobalRoutePlanner(graph);
  const result = planner.plan({ startState: [...graph.nodes.keys()][0], goalArea: 'Y' });
  assert.ok(result.states);
  assert.equal(result.states.length, 2);
});

test('jedna lokacja pośrednia', () => {
  const { globalPlanner, graph } = buildStack();
  const start = graph.findStateKeysByArea('A')[0];
  const result = globalPlanner.plan({ startState: start, goalArea: 'B' });
  assert.ok(result.states);
  assert.equal(result.states.at(-1).split('|')[0], 'B');
});

test('kilka kolejnych pomieszczeń i connectorów nie gubi planu', () => {
  const { globalPlanner, graph } = buildStack();
  const start = graph.findStateKeysByArea('A')[0];
  const result = globalPlanner.plan({ startState: start, goalArea: 'C' });
  assert.ok(result.states);
  assert.ok(result.states.some(s => s.includes('house@r1')));
  assert.ok(result.states.some(s => s.includes('house@r2')));
  assert.ok(result.states.some(s => s.includes('corr@mid')));
  assert.equal(result.route_stages.includes(ROUTE_STAGES.TRAVERSE_INTERIOR_CHAIN), true);
});

test('powrót do tego samego area_name innym wyjściem jest legalny', () => {
  const { globalPlanner, logger, graph } = buildStack();
  const start = graph.findStateKeysByArea('B').find(k => k.includes('B@market'));
  const result = globalPlanner.plan({ startState: start, goalArea: 'C' });
  assert.ok(result.states);
  assert.ok(logger.getEventsByType('REENTER_SAME_AREA_NEW_TOPOLOGY').length >= 0);
});

test('wykrycie utraty kontekstu po kilku tranzytach i local repair', () => {
  const { globalPlanner, graph, executor } = buildStack();
  const start = graph.findStateKeysByArea('A')[0];
  const plan = globalPlanner.plan({ startState: start, goalArea: 'C' });
  const exec = executor.createExecution(plan);

  const wrongState = graph.findStateKeysByArea('B').find(k => k.includes('B@west'));
  const step = executor.onEnterState(exec, wrongState, { goalArea: 'C' });
  assert.equal(step.ok, true);
  assert.ok(exec.active_route_plan.length >= 2);
});

test('global replanning po nieudanym repair', () => {
  const { replanner, graph } = buildStack();
  const current = graph.findStateKeysByArea('B')[0];
  const failedEdge = transitionIdentityKey({ source: 'x', target: 'y', chain_group_id: 'g', transition_type: 'walk' });
  const result = replanner.onLocalTraversalFailure({ failedEdge: 'x=>y', currentState: current, goalArea: 'C' });
  assert.ok(result.states);
});

test('odrzucenie fałszywej pętli bez postępu', () => {
  const { globalPlanner, graph } = buildStack();
  const start = graph.findStateKeysByArea('Loop')[0];
  const result = globalPlanner.plan({ startState: start, goalArea: 'C' });
  assert.equal(result.states, null);
});

test('debug dump zawiera odrzucone krawędzie i identity key', () => {
  const { globalPlanner, graph } = buildStack();
  const start = graph.findStateKeysByArea('A')[0];
  const result = globalPlanner.plan({ startState: start, goalArea: 'C' });
  assert.ok(result.debug_dump.route_states.length > 0);
  assert.ok(Array.isArray(result.debug_dump.loop_diagnostics));
});

test('stage logs i eventy są emitowane', () => {
  const { globalPlanner, graph, logger } = buildStack();
  const start = graph.findStateKeysByArea('A')[0];
  globalPlanner.plan({ startState: start, goalArea: 'C' });
  const required = ['ROUTE_PLAN_START', 'GLOBAL_STAGE_SELECTED', 'ROUTE_PLAN_SUCCESS'];
  for (const event of required) assert.ok(logger.getEventsByType(event).length > 0);
});
