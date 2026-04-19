const { createStateIdentity, stateKey } = require('./state-identity');

class RouteGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(nodeInput) {
    const node = createStateIdentity(nodeInput);
    const key = stateKey(node);
    const existing = this.nodes.get(key);
    this.nodes.set(key, existing ? { ...existing, ...node } : node);
    if (!this.edges.has(key)) this.edges.set(key, []);
    return key;
  }

  addEdge(fromNodeInput, toNodeInput, metadata = {}) {
    const from = this.addNode(fromNodeInput);
    const to = this.addNode(toNodeInput);
    const edge = {
      source: from,
      target: to,
      source_area: this.nodes.get(from).areaName,
      source_exit_id: metadata.source_exit_id || this.nodes.get(from).exitId || null,
      target_area: this.nodes.get(to).areaName,
      target_entry_id: metadata.target_entry_id || this.nodes.get(to).entryId || null,
      position: metadata.position || null,
      standPosition: metadata.standPosition || null,
      tags: metadata.tags || [],
      constraints: metadata.constraints || null,
      oneWay: metadata.oneWay ?? (metadata.tags || []).includes('one_way'),
      weight: metadata.weight ?? 1,
      debugLabel: metadata.debugLabel || `${from} -> ${to}`
    };

    this.edges.get(from).push(edge);

    if (!edge.oneWay) {
      this.edges.get(to).push({
        ...edge,
        source: to,
        target: from,
        source_area: edge.target_area,
        source_exit_id: edge.target_entry_id,
        target_area: edge.source_area,
        target_entry_id: edge.source_exit_id,
        debugLabel: `${to} -> ${from}`
      });
    }

    return edge;
  }

  getNode(key) {
    return this.nodes.get(key);
  }

  getOutgoingEdges(key) {
    return this.edges.get(key) || [];
  }

  findStateKeysByArea(areaName) {
    return [...this.nodes.entries()]
      .filter(([, n]) => n.areaName === areaName)
      .map(([k]) => k);
  }
}

module.exports = {
  RouteGraph
};
