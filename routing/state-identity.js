function createStateIdentity({
  areaName,
  stateId,
  entryId,
  exitId,
  startZone,
  areaType,
  traversalContext = {}
}) {
  return {
    areaName,
    stateId: stateId || `${areaName}@${entryId || 'unknown'}`,
    entryId: entryId || null,
    exitId: exitId || null,
    startZone: startZone || null,
    areaType: areaType || 'outer_area',
    traversalContext: { ...traversalContext }
  };
}

function stateKey(state) {
  const ctx = JSON.stringify(state.traversalContext || {});
  return [
    state.areaName,
    state.stateId,
    state.entryId || '-',
    state.exitId || '-',
    state.startZone || '-',
    state.areaType || '-',
    ctx
  ].join('|');
}

function topologicalSignature(state) {
  const ctx = state.traversalContext || {};
  return [
    state.areaName,
    state.entryId || '-',
    state.exitId || '-',
    state.startZone || '-',
    state.areaType || '-',
    Object.keys(ctx).sort().map(k => `${k}:${ctx[k]}`).join(',')
  ].join('|');
}

module.exports = {
  createStateIdentity,
  stateKey,
  topologicalSignature
};
