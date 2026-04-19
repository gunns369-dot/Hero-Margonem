const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loadTransitionGraph,
  GlobalRoutePlanner,
  LocalTraversalPlanner,
  RouteReplanner,
  RouteDebugLogger
} = require('../routing');

function buildFixtureGraph() {
  return loadTransitionGraph({
    transitions: [
      {
        id: 'A_to_B_gate',
        source: { area: 'A', state_id: 'A@north', exit_id: 'north_gate', area_type: 'outer_area' },
        target: { area: 'B', state_id: 'B@west', entry_id: 'west_entry', exit_id: 'west_entry', area_type: 'outer_area' },
        tags: ['door', 'two_way']
      },
      {
        id: 'B_west_to_house',
        source: { area: 'B', state_id: 'B@west', entry_id: 'west_entry', exit_id: 'west_entry', area_type: 'outer_area' },
        target: { area: 'B_house', state_id: 'B_house@foyer', entry_id: 'door_a', exit_id: 'hall', area_type: 'interior' },
        tags: ['house', 'interior', 'two_way']
      },
      {
        id: 'B_house_to_connector',
        source: { area: 'B_house', state_id: 'B_house@foyer', entry_id: 'door_a', exit_id: 'hall', area_type: 'interior' },
        target: { area: 'B_link', state_id: 'B_link@corridor', entry_id: 'hall', exit_id: 'stairs_up', area_type: 'connector' },
        tags: ['stairs', 'two_way']
      },
      {
        id: 'B_connector_to_market_side',
        source: { area: 'B_link', state_id: 'B_link@corridor', entry_id: 'hall', exit_id: 'stairs_up', area_type: 'connector' },
        target: { area: 'B', state_id: 'B@market', entry_id: 'market_entry', exit_id: 'east_gate', area_type: 'outer_area' },
        tags: ['tunnel', 'two_way']
      },
      {
        id: 'B_market_to_C',
        source: { area: 'B', state_id: 'B@market', entry_id: 'market_entry', exit_id: 'east_gate', area_type: 'outer_area' },
        target: { area: 'C', state_id: 'C@south', entry_id: 'south_gate', exit_id: 'south_gate', area_type: 'outer_area' },
        tags: ['door', 'two_way']
      },
      {
        id: 'B_west_bad_loop',
        source: { area: 'B', state_id: 'B@west_loop', exit_id: 'loop_exit', area_type: 'outer_area' },
        target: { area: 'B', state_id: 'B@west_loop', entry_id: 'loop_entry', exit_id: 'loop_exit', area_type: 'outer_area' },
        tags: ['portal', 'two_way']
      },
      {
        id: 'B_loop_to_west',
        source: { area: 'B', state_id: 'B@west_loop', entry_id: 'loop_entry', exit_id: 'loop_exit', area_type: 'outer_area' },
        target: { area: 'B', state_id: 'B@west', entry_id: 'west_entry', exit_id: 'west_entry', area_type: 'outer_area' },
        tags: ['stairs', 'two_way']
      },
      {
        id: 'connector_chain_1',
        source: { area: 'C', state_id: 'C@south', entry_id: 'south_gate', exit_id: 'south_gate', area_type: 'outer_area' },
        target: { area: 'Chain1', state_id: 'Chain1@in', entry_id: 'mine', exit_id: 'mid', area_type: 'connector' },
        tags: ['tunnel', 'two_way']
      },
      {
        id: 'connector_chain_2',
        source: { area: 'Chain1', state_id: 'Chain1@in', entry_id: 'mine', exit_id: 'mid', area_type: 'connector' },
        target: { area: 'Chain2', state_id: 'Chain2@in', entry_id: 'mid', exit_id: 'far', area_type: 'connector' },
        tags: ['tunnel', 'two_way']
      },
      {
        id: 'connector_chain_3',
        source: { area: 'Chain2', state_id: 'Chain2@in', entry_id: 'mid', exit_id: 'far', area_type: 'connector' },
        target: { area: 'D', state_id: 'D@target', entry_id: 'north', exit_id: 'north', area_type: 'outer_area' },
        tags: ['door', 'two_way']
      }
    ]
  });
}

test('zwykła trasa bez lokacji pośrednich', () => {
  const graph = loadTransitionGraph({
    transitions: [
      {
        id: 'simple',
        source: { area: 'X', state_id: 'X@a', exit_id: 'toY', area_type: 'outer_area' },
        target: { area: 'Y', state_id: 'Y@b', entry_id: 'fromX', exit_id: 'toY', area_type: 'outer_area' },
        tags: ['door', 'two_way']
      }
    ]
  });

  const logger = new RouteDebugLogger();
  const planner = new GlobalRoutePlanner(graph, { logger });
  const result = planner.plan({ startState: 'X|X@a|-|toY|-|outer_area|{}', goalArea: 'Y' });

  assert.ok(result.states);
  assert.equal(result.states.length, 2);
});

test('trasa przez wnętrze i powrót do tego samego obszaru innym wyjściem', () => {
  const graph = buildFixtureGraph();
  const logger = new RouteDebugLogger();
  const planner = new GlobalRoutePlanner(graph, { logger });

  const result = planner.plan({
    startState: 'A|A@north|-|north_gate|-|outer_area|{}',
    goalArea: 'C'
  });

  assert.ok(result.states);
  assert.deepEqual(result.states, [
    'A|A@north|-|north_gate|-|outer_area|{}',
    'B|B@west|west_entry|west_entry|-|outer_area|{}',
    'B_house|B_house@foyer|door_a|hall|-|interior|{}',
    'B_link|B_link@corridor|hall|stairs_up|-|connector|{}',
    'B|B@market|market_entry|east_gate|-|outer_area|{}',
    'C|C@south|south_gate|south_gate|-|outer_area|{}'
  ]);

  assert.ok(logger.getEventsByType('REENTER_SAME_AREA_WITH_NEW_STATE').length > 0);
});

test('trasa z kilkoma kolejnymi connector nodes', () => {
  const graph = buildFixtureGraph();
  const planner = new GlobalRoutePlanner(graph);
  const result = planner.plan({
    startState: 'A|A@north|-|north_gate|-|outer_area|{}',
    goalArea: 'D'
  });

  assert.ok(result.states);
  assert.ok(result.states.some(s => s.startsWith('Chain1|')));
  assert.ok(result.states.some(s => s.startsWith('Chain2|')));
});

test('pętla bez zmiany stanu topologicznego jest odrzucana na rzecz lepszej ścieżki', () => {
  const graph = buildFixtureGraph();
  const planner = new GlobalRoutePlanner(graph);

  const result = planner.plan({
    startState: 'B|B@west_loop|loop_entry|loop_exit|-|outer_area|{}',
    goalArea: 'C'
  });

  assert.ok(result.states);
  assert.ok(!result.states.includes('B|B@west_loop|loop_entry|loop_exit|-|outer_area|{}') || result.states.length < 8);
});

test('local traversal znajduje alternatywne wyjście i replanuje globalnie', () => {
  const graph = buildFixtureGraph();
  const logger = new RouteDebugLogger();
  const globalPlanner = new GlobalRoutePlanner(graph, { logger });
  const localPlanner = new LocalTraversalPlanner(graph, { logger });
  const replanner = new RouteReplanner({ globalPlanner, localPlanner, logger });

  const initial = globalPlanner.plan({
    startState: 'A|A@north|-|north_gate|-|outer_area|{}',
    goalArea: 'C'
  });

  assert.ok(initial.states);
  const failedEdge = 'B_link|B_link@corridor|hall|stairs_up|-|connector|{}=>B|B@market|market_entry|east_gate|-|outer_area|{}';

  const replanned = replanner.onLocalTraversalFailure({
    failedEdge,
    currentState: 'B|B@west|west_entry|west_entry|-|outer_area|{}',
    goalArea: 'C'
  });

  assert.equal(replanned.states, null);
  assert.ok(logger.getEventsByType('GLOBAL_REPLAN').length > 0);
  assert.ok(logger.getEventsByType('LOCAL_EXIT_UNREACHABLE').length > 0);
});

test('debug logger zbiera kluczowe eventy planowania', () => {
  const graph = buildFixtureGraph();
  const logger = new RouteDebugLogger();
  const planner = new GlobalRoutePlanner(graph, { logger });

  planner.plan({ startState: 'A|A@north|-|north_gate|-|outer_area|{}', goalArea: 'D' });

  const required = [
    'ROUTE_PLAN_START',
    'ROUTE_NODE_EXPANDED',
    'CONNECTOR_PATH_DISCOVERED',
    'ROUTE_PLAN_SUCCESS'
  ];

  for (const event of required) {
    assert.ok(logger.getEventsByType(event).length > 0, `missing ${event}`);
  }
});
