const { navigationState, stateIdentityKey } = require('./state-model');

class AreaCluster {
  constructor({ id, type = 'ConnectorSubgraph', stateKeys = [] } = {}) {
    this.id = id;
    this.type = type;
    this.stateKeys = new Set(stateKeys);
  }
}

class RouteGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.clusters = new Map();
  }

  addNode(nodeInput) {
    const node = navigationState(nodeInput);
    const key = stateIdentityKey(node);
    const existing = this.nodes.get(key);
    this.nodes.set(key, existing ? { ...existing, ...node } : node);
    if (!this.edges.has(key)) this.edges.set(key, []);
    return key;
  }

  addEdge(fromNodeInput, toNodeInput, metadata = {}) {
    const source = this.addNode(fromNodeInput);
    const target = this.addNode(toNodeInput);
    const sourceNode = this.nodes.get(source);
    const targetNode = this.nodes.get(target);

    const edge = {
      source,
      target,
      source_state_pattern: metadata.source_state_pattern || sourceNode.state_id,
      target_state_pattern: metadata.target_state_pattern || targetNode.state_id,
      transition_type: metadata.transition_type || 'walk',
      entry_anchor: metadata.entry_anchor || sourceNode.entry_id || null,
      exit_anchor: metadata.exit_anchor || targetNode.exit_id || null,
      bidirectional: metadata.bidirectional ?? !metadata.oneWay,
      cost: metadata.cost ?? metadata.weight ?? 1,
      is_connector: metadata.is_connector ?? ['connector', 'transition', 'corridor'].includes(targetNode.area_instance_type),
      chain_group_id: metadata.chain_group_id || null,
      topology_effect: metadata.topology_effect || 'same_cluster_move',
      tags: metadata.tags || [],
      debugLabel: metadata.debugLabel || `${source} -> ${target}`
    };

    this.edges.get(source).push(edge);

    if (edge.bidirectional) {
      this.edges.get(target).push({
        ...edge,
        source: target,
        target: source,
        entry_anchor: edge.exit_anchor,
        exit_anchor: edge.entry_anchor,
        debugLabel: `${target} -> ${source}`
      });
    }

    if (edge.chain_group_id) {
      this.#registerCluster(edge.chain_group_id, source, target);
    }

    return edge;
  }

  #registerCluster(clusterId, source, target) {
    if (!this.clusters.has(clusterId)) {
      this.clusters.set(clusterId, new AreaCluster({ id: clusterId, type: 'InteriorChain' }));
    }
    const cluster = this.clusters.get(clusterId);
    cluster.stateKeys.add(source);
    cluster.stateKeys.add(target);
  }

  getNode(key) { return this.nodes.get(key); }
  getOutgoingEdges(key) { return this.edges.get(key) || []; }
  getCluster(id) { return this.clusters.get(id) || null; }

  findStateKeysByArea(areaName) {
    return [...this.nodes.entries()].filter(([, n]) => n.area_name === areaName).map(([k]) => k);
  }
}

module.exports = { RouteGraph, AreaCluster };
