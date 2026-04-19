const test = require('node:test');
const assert = require('node:assert/strict');
const { AgentStateController, STATES } = require('../agent-state-controller');

const exits = [
  { id: 'A', distance: 8, path: ['p1', 'p2'] },
  { id: 'B', distance: 3, path: ['q1'] }
];

test('normalna praca bez zagrożenia', () => {
  const ctrl = new AgentStateController({ dangerLostTimeoutMs: 2000 });
  ctrl.setTaskContext({
    plan: ['go', 'collect'],
    target: 'resource-1',
    routeProgress: { idx: 1 },
    modeConfig: { autoLoot: true }
  });

  ctrl.tick({ dangerVisible: false, now: 1000 });

  assert.equal(ctrl.state, STATES.TASK_ACTIVE);
  assert.deepEqual(ctrl.getNextTarget(), {
    type: 'regular',
    target: 'resource-1',
    plan: ['go', 'collect']
  });
  assert.equal(ctrl.shouldSuppressCombatOrInteraction(), false);
});

test('wejście w alarm podczas aktywnego tasku preemptuje normalne cele', () => {
  const ctrl = new AgentStateController({ dangerLostTimeoutMs: 2000 });
  ctrl.setTaskContext({
    plan: ['go', 'collect'],
    target: 'resource-1',
    routeProgress: { idx: 2 },
    modeConfig: { autoLoot: true }
  });

  ctrl.enterEmergency({ safeExits: exits, now: 3000, dangerSource: 'enemy-nearby' });

  assert.equal(ctrl.state, STATES.EMERGENCY_ESCAPE);
  assert.equal(ctrl.flags.ignore_regular_targets_while_escape, true);
  assert.equal(ctrl.flags.suppress_combat_or_interaction_during_escape, true);
  assert.equal(ctrl.currentTarget, null);
  assert.deepEqual(ctrl.currentPlan, []);
  assert.equal(ctrl.getNextTarget().type, 'escape');
  assert.equal(ctrl.getNextTarget().target, 'B');
});

test('utrzymywanie alarmu blokuje powrót do tasku', () => {
  const ctrl = new AgentStateController({ dangerLostTimeoutMs: 3000 });
  ctrl.setTaskContext({ plan: ['hunt'], target: 'mob-7' });
  ctrl.enterEmergency({ safeExits: exits, now: 1000 });

  ctrl.tick({ dangerVisible: true, now: 2500 });
  ctrl.tick({ dangerVisible: false, now: 3000 });

  assert.equal(ctrl.state, STATES.EMERGENCY_ESCAPE);
  assert.equal(ctrl.flags.resume_allowed, false);
  assert.equal(ctrl.getNextTarget().type, 'escape');
});

test('ustanie alarmu po timeout i wznowienie tasku z snapshotu', () => {
  const ctrl = new AgentStateController({ dangerLostTimeoutMs: 1000 });
  ctrl.setTaskContext({
    plan: ['go', 'collect'],
    target: 'resource-1',
    routeProgress: { idx: 4 },
    modeConfig: { autoLoot: true }
  });

  ctrl.enterEmergency({ safeExits: exits, now: 1000 });
  ctrl.tick({ dangerVisible: false, now: 1500 });
  assert.equal(ctrl.state, STATES.EMERGENCY_ESCAPE);

  ctrl.tick({ dangerVisible: false, now: 2200 });

  assert.equal(ctrl.state, STATES.TASK_ACTIVE);
  assert.equal(ctrl.currentTarget, 'resource-1');
  assert.deepEqual(ctrl.currentPlan, ['go', 'collect']);
  assert.equal(ctrl.flags.current_task_snapshot, null);

  const resumed = ctrl.events.some(e => e.event === 'RESUME_PREVIOUS_TASK');
  const dangerCleared = ctrl.events.some(e => e.event === 'DANGER_CLEARED');
  assert.equal(resumed, true);
  assert.equal(dangerCleared, true);
});

test('ponowny alarm w trakcie recovery tworzy nową preempcję', () => {
  const ctrl = new AgentStateController({ dangerLostTimeoutMs: 500 });
  ctrl.setTaskContext({ plan: ['go'], target: 'resource-9', routeProgress: { idx: 1 } });
  ctrl.enterEmergency({ safeExits: exits, now: 1000 });

  ctrl.tick({ dangerVisible: false, now: 1700 }); // clear + resume
  assert.equal(ctrl.state, STATES.TASK_ACTIVE);

  ctrl.enterEmergency({
    safeExits: [
      { id: 'X', distance: 2, path: ['x1'] },
      { id: 'Y', distance: 9, path: ['y1'] }
    ],
    now: 1800,
    dangerSource: 'second-wave'
  });

  assert.equal(ctrl.state, STATES.EMERGENCY_ESCAPE);
  assert.equal(ctrl.getNextTarget().target, 'X');
  assert.equal(ctrl.flags.ignore_regular_targets_while_escape, true);
});
