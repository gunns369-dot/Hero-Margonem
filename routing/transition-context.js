class TransitionContext {
  constructor({
    from_state_key,
    high_level_goal,
    high_level_exit,
    traversed_connector_nodes,
    expected_next_states,
    replan_count
  } = {}) {
    this.from_state_key = from_state_key || null;
    this.high_level_goal = high_level_goal || null;
    this.high_level_exit = high_level_exit || null;
    this.traversed_connector_nodes = [...(traversed_connector_nodes || [])];
    this.expected_next_states = [...(expected_next_states || [])];
    this.replan_count = replan_count || 0;
  }

  registerConnector(stateKey) {
    if (!this.traversed_connector_nodes.includes(stateKey)) this.traversed_connector_nodes.push(stateKey);
  }

  setExpectedNext(sequence = []) {
    this.expected_next_states = [...sequence];
  }

  incrementReplan() {
    this.replan_count += 1;
  }

  toJSON() {
    return {
      from_state_key: this.from_state_key,
      high_level_goal: this.high_level_goal,
      high_level_exit: this.high_level_exit,
      traversed_connector_nodes: [...this.traversed_connector_nodes],
      expected_next_states: [...this.expected_next_states],
      replan_count: this.replan_count
    };
  }
}

module.exports = { TransitionContext };
