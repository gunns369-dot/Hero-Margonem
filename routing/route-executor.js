class RouteExecutor {
  constructor({ graph, repairEngine, logger }) {
    this.graph = graph;
    this.repairEngine = repairEngine;
    this.logger = logger;
  }

  createExecution(planResult) {
    return {
      active_route_plan: [...(planResult.active_route_plan || planResult.states || [])],
      active_subroute_plan: [...(planResult.active_subroute_plan || [])],
      current_plan_index: 0,
      expected_next_state: planResult.expected_next_state || null,
      transition_context: planResult.transition_context,
      route_stages: [...(planResult.route_stages || [])]
    };
  }

  onEnterState(execution, enteredState, { goalArea } = {}) {
    const expected = execution.expected_next_state;
    if (expected && enteredState !== expected) {
      this.logger?.emit('STATE_MISMATCH_ON_ENTER', {
        current_state_key: enteredState,
        expected_next_state: expected,
        current_stage: execution.route_stages[execution.current_plan_index] || null,
        reason: 'entered_unexpected_state'
      });

      const level1 = this.repairEngine.repair({ level: 'repair_level_1', currentState: enteredState, expectedNextState: expected, goalArea });
      if (level1.repaired) return this.#applyRepair(execution, level1.plan);

      const level2 = this.repairEngine.repair({ level: 'repair_level_2', currentState: enteredState, expectedNextState: expected, goalArea });
      if (level2.repaired) return this.#applyRepair(execution, level2.plan);

      const level3 = this.repairEngine.repair({ level: 'repair_level_3', currentState: enteredState, expectedNextState: expected, goalArea });
      if (level3.repaired) return this.#applyRepair(execution, level3.plan);
      return { ok: false, execution };
    }

    const idx = execution.active_route_plan.indexOf(enteredState);
    execution.current_plan_index = idx === -1 ? execution.current_plan_index + 1 : idx;
    execution.expected_next_state = execution.active_route_plan[execution.current_plan_index + 1] || null;
    this.logger?.emit('SUBROUTE_STEP_ACCEPTED', {
      current_state_key: enteredState,
      expected_next_state: execution.expected_next_state,
      chain_depth: execution.current_plan_index,
      reason: 'plan_validation_on_enter'
    });
    return { ok: true, execution };
  }

  #applyRepair(execution, repairedPlan) {
    execution.active_route_plan = [...repairedPlan];
    execution.current_plan_index = 0;
    execution.expected_next_state = repairedPlan[1] || null;
    return { ok: true, execution, repaired: true };
  }
}

module.exports = { RouteExecutor };
