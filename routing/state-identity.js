const { navigationState, stateIdentityKey, deriveTopologyHash } = require('./state-model');

function createStateIdentity(input) {
  return navigationState(input);
}

function stateKey(state) {
  return stateIdentityKey(state);
}

function topologicalSignature(state) {
  const normalized = navigationState(state);
  return [
    normalized.area_name,
    normalized.entry_id || '-',
    normalized.exit_id || '-',
    normalized.zone_id || normalized.anchor_position || '-',
    normalized.area_instance_type,
    normalized.reachable_exit_set_signature,
    deriveTopologyHash(normalized)
  ].join('|');
}

module.exports = {
  createStateIdentity,
  stateKey,
  topologicalSignature
};
