const crypto = require('node:crypto');

const ROUTE_STAGES = Object.freeze({
  GLOBAL_APPROACH: 'GLOBAL_APPROACH',
  ENTER_SUBGRAPH: 'ENTER_SUBGRAPH',
  TRAVERSE_INTERIOR_CHAIN: 'TRAVERSE_INTERIOR_CHAIN',
  EXIT_SUBGRAPH: 'EXIT_SUBGRAPH',
  RETURN_TO_OUTER_GRAPH: 'RETURN_TO_OUTER_GRAPH',
  FINAL_APPROACH: 'FINAL_APPROACH'
});

const AREA_INSTANCE_TYPES = new Set(['outer', 'interior', 'connector', 'transition', 'room', 'corridor']);

function stableStringify(value) {
  if (!value || typeof value !== 'object') return JSON.stringify(value ?? {});
  const keys = Object.keys(value).sort();
  const out = {};
  for (const k of keys) out[k] = value[k];
  return JSON.stringify(out);
}

function deriveTopologyHash(payload) {
  const raw = [
    payload.area_name,
    payload.area_instance_type,
    payload.entry_id || '-',
    payload.exit_id || '-',
    payload.zone_id || payload.anchor_position || '-',
    payload.reachable_exit_set_signature || '-',
    stableStringify(payload.parent_transition_context || {})
  ].join('|');
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12);
}

function navigationState(input = {}) {
  const area_instance_type = AREA_INSTANCE_TYPES.has(input.area_instance_type)
    ? input.area_instance_type
    : (input.area_instance_type || input.areaType || 'outer');

  const state = {
    area_name: input.area_name || input.areaName,
    area_instance_type,
    entry_id: input.entry_id ?? input.entryId ?? null,
    exit_id: input.exit_id ?? input.exitId ?? null,
    anchor_position: input.anchor_position ?? null,
    zone_id: input.zone_id ?? input.startZone ?? null,
    reachable_exit_set_signature: input.reachable_exit_set_signature
      || (Array.isArray(input.reachable_exits)
        ? [...input.reachable_exits].sort().join(',')
        : (input.exit_id ?? input.exitId ?? '-')),
    parent_transition_context: { ...(input.parent_transition_context || input.traversalContext || {}) }
  };

  state.state_id = input.state_id || input.stateId || `${state.area_name}@${state.entry_id || state.zone_id || 'unknown'}`;
  state.topology_hash = input.topology_hash || deriveTopologyHash(state);

  return state;
}

function stateIdentityKey(stateInput) {
  const state = navigationState(stateInput);
  return [
    state.area_name,
    state.state_id,
    state.area_instance_type,
    state.entry_id || '-',
    state.exit_id || '-',
    state.zone_id || state.anchor_position || '-',
    state.reachable_exit_set_signature || '-',
    state.topology_hash
  ].join('|');
}

function transitionIdentityKey(edge) {
  return [
    edge.chain_group_id || '-',
    edge.transition_type || '-',
    edge.source,
    edge.target,
    edge.entry_anchor || '-',
    edge.exit_anchor || '-'
  ].join('=>');
}

module.exports = {
  ROUTE_STAGES,
  navigationState,
  stateIdentityKey,
  transitionIdentityKey,
  deriveTopologyHash
};
