import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, G } from 'react-native-svg';
import axios from 'axios';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');
const GRAPH_WIDTH = width - 48;
const GRAPH_HEIGHT = height - 250;

const COLORS = {
  background: '#0a1628',
  card: '#f5f5f0',
  accent: '#4a9d8c',
  text: '#0a1628',
  textLight: '#f5f5f0',
  textMuted: '#6b7280',
};

const TYPE_COLORS: { [key: string]: string } = {
  book: '#8b5cf6',
  note: '#3b82f6',
  article: '#f59e0b',
  quote: '#ec4899',
  idea: '#10b981',
};

interface KnowledgeNode {
  id: string;
  type: string;
  title: string;
  content: string;
}

interface Connection {
  fromNodeId: string;
  toNodeId: string;
  similarityScore: number;
}

interface GraphData {
  nodes: KnowledgeNode[];
  connections: Connection[];
}

interface SimNode {
  id: string;
  type: string;
  title: string;
  x?: number;
  y?: number;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  weight: number;
}

export default function GraphScreen() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/graph`);
      setGraphData(response.data);
      processGraphData(response.data);
    } catch (error) {
      console.error('Error fetching graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const processGraphData = (data: GraphData) => {
    if (!data.nodes.length) {
      setSimNodes([]);
      setSimLinks([]);
      return;
    }

    // Prepare nodes for simulation
    const nodes: SimNode[] = data.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      title: node.title,
      x: GRAPH_WIDTH / 2 + (Math.random() - 0.5) * 100,
      y: GRAPH_HEIGHT / 2 + (Math.random() - 0.5) * 100,
    }));

    // Prepare links for simulation
    const links: SimLink[] = data.connections.map((conn) => ({
      source: conn.fromNodeId,
      target: conn.toNodeId,
      weight: conn.similarityScore,
    }));

    // Run force simulation
    const simulation = forceSimulation<SimNode>(nodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(GRAPH_WIDTH / 2, GRAPH_HEIGHT / 2))
      .force('collision', forceCollide(30))
      .stop();

    // Run simulation ticks
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }

    // Clamp positions to bounds
    nodes.forEach((node) => {
      node.x = Math.max(30, Math.min(GRAPH_WIDTH - 30, node.x || GRAPH_WIDTH / 2));
      node.y = Math.max(30, Math.min(GRAPH_HEIGHT - 30, node.y || GRAPH_HEIGHT / 2));
    });

    setSimNodes(nodes);
    setSimLinks(links);
  };

  const handleNodePress = (node: SimNode) => {
    setSelectedNode(node);
  };

  const handleViewDetails = () => {
    if (selectedNode) {
      router.push(`/node-detail?id=${selectedNode.id}`);
    }
  };

  // Get link positions
  const linkPositions = useMemo(() => {
    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
    return simLinks.map((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const source = nodeMap.get(sourceId);
      const target = nodeMap.get(targetId);
      return {
        x1: source?.x || 0,
        y1: source?.y || 0,
        x2: target?.x || 0,
        y2: target?.y || 0,
        weight: link.weight,
      };
    });
  }, [simNodes, simLinks]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Knowledge Graph</Text>
        <TouchableOpacity onPress={fetchGraphData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading graph...</Text>
        </View>
      ) : simNodes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="git-network-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No nodes yet</Text>
          <Text style={styles.emptySubtext}>Add some knowledge nodes to see your graph</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-node')}
          >
            <Ionicons name="add" size={20} color={COLORS.textLight} />
            <Text style={styles.addButtonText}>Add First Node</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.graphContainer}>
          <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
            {/* Draw edges */}
            {linkPositions.map((link, index) => (
              <Line
                key={`link-${index}`}
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={COLORS.accent}
                strokeWidth={Math.max(1, link.weight * 3)}
                strokeOpacity={0.4}
              />
            ))}

            {/* Draw nodes */}
            {simNodes.map((node) => (
              <G key={node.id}>
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={selectedNode?.id === node.id ? 22 : 18}
                  fill={TYPE_COLORS[node.type] || COLORS.accent}
                  stroke={selectedNode?.id === node.id ? COLORS.textLight : 'none'}
                  strokeWidth={selectedNode?.id === node.id ? 3 : 0}
                  onPress={() => handleNodePress(node)}
                />
              </G>
            ))}
          </Svg>

          {/* Node count info */}
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {simNodes.length} node{simNodes.length !== 1 ? 's' : ''} • {simLinks.length} connection{simLinks.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Selected node panel */}
      {selectedNode && (
        <View style={styles.selectedPanel}>
          <View style={styles.selectedHeader}>
            <View
              style={[
                styles.selectedTypeBadge,
                { backgroundColor: TYPE_COLORS[selectedNode.type] || COLORS.accent },
              ]}
            >
              <Text style={styles.selectedTypeBadgeText}>
                {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedNode(null)}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedTitle} numberOfLines={2}>
            {selectedNode.title}
          </Text>
          <TouchableOpacity style={styles.viewButton} onPress={handleViewDetails}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  graphContainer: {
    flex: 1,
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsBar: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: 'rgba(10, 22, 40, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedPanel: {
    backgroundColor: COLORS.card,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});
