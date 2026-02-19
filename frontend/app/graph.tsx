import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');
const GRAPH_WIDTH = width - 48;
const GRAPH_HEIGHT = height * 0.55;

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

interface NodePosition {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
}

export default function GraphScreen() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodePosition | null>(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/graph`);
      setGraphData(response.data);
      calculatePositions(response.data);
    } catch (error) {
      console.error('Error fetching graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePositions = (data: GraphData) => {
    if (!data.nodes.length) {
      setNodePositions([]);
      return;
    }

    // Calculate grid positions to fit all nodes
    const numNodes = data.nodes.length;
    const cols = Math.min(3, Math.ceil(Math.sqrt(numNodes)));
    const rows = Math.ceil(numNodes / cols);
    const nodeSize = 40;
    const padding = 20;
    const availableWidth = GRAPH_WIDTH - (padding * 2);
    const availableHeight = GRAPH_HEIGHT - (padding * 2);
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    const positions: NodePosition[] = data.nodes.map((node, index) => ({
      id: node.id,
      type: node.type,
      title: node.title,
      x: padding + (index % cols) * cellWidth + (cellWidth - nodeSize) / 2,
      y: padding + Math.floor(index / cols) * cellHeight + (cellHeight - nodeSize) / 2,
    }));

    setNodePositions(positions);
  };

  const handleNodePress = (node: NodePosition) => {
    setSelectedNode(node);
  };

  const handleViewDetails = () => {
    if (selectedNode) {
      router.push(`/node-detail?id=${selectedNode.id}`);
    }
  };

  // Get connection lines
  const getConnectionLines = () => {
    if (!graphData || !nodePositions.length) return [];
    
    const nodeMap = new Map(nodePositions.map(n => [n.id, n]));
    
    return graphData.connections.map((conn, index) => {
      const fromNode = nodeMap.get(conn.fromNodeId);
      const toNode = nodeMap.get(conn.toNodeId);
      
      if (!fromNode || !toNode) return null;
      
      return {
        key: `line-${index}`,
        x1: fromNode.x + 20,
        y1: fromNode.y + 20,
        x2: toNode.x + 20,
        y2: toNode.y + 20,
        weight: conn.similarityScore,
      };
    }).filter(Boolean);
  };

  const connectionLines = getConnectionLines();

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
      ) : nodePositions.length === 0 ? (
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
        <ScrollView 
          style={styles.graphScrollView}
          contentContainerStyle={styles.graphScrollContent}
        >
          <View style={[styles.graphArea, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT }]}>
            {/* Connection lines - rendered as simple line views */}
            {connectionLines.map((line: any) => {
              if (!line) return null;
              const dx = line.x2 - line.x1;
              const dy = line.y2 - line.y1;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              
              return (
                <View
                  key={line.key}
                  style={[
                    styles.connectionLine,
                    {
                      width: length,
                      left: line.x1,
                      top: line.y1,
                      transform: [{ rotate: `${angle}deg` }],
                      opacity: 0.3 + line.weight * 0.4,
                    },
                  ]}
                />
              );
            })}
            
            {/* Nodes */}
            {nodePositions.map((node) => (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.graphNode,
                  {
                    left: node.x,
                    top: node.y,
                    backgroundColor: TYPE_COLORS[node.type] || COLORS.accent,
                    borderColor: selectedNode?.id === node.id ? COLORS.textLight : 'transparent',
                    borderWidth: selectedNode?.id === node.id ? 3 : 0,
                  },
                ]}
                onPress={() => handleNodePress(node)}
              >
                <Text style={styles.nodeInitial}>
                  {node.type.charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Node count info */}
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {nodePositions.length} node{nodePositions.length !== 1 ? 's' : ''} • {graphData?.connections.length || 0} connection{(graphData?.connections.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
        </ScrollView>
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
    alignItems: 'center',
  },
  graphArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    position: 'relative',
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.accent,
    transformOrigin: 'left center',
  },
  graphNode: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  statsBar: {
    marginTop: 12,
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
