import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  background: '#0a1628',
  card: '#f5f5f0',
  accent: '#4a9d8c',
  text: '#0a1628',
  textLight: '#f5f5f0',
  textMuted: '#6b7280',
  error: '#ef4444',
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
  source?: string;
  tags: string[];
  createdAt: string;
}

interface ConnectedNode {
  node: KnowledgeNode;
  similarityScore: number;
}

interface NodeData {
  node: KnowledgeNode;
  connections: ConnectedNode[];
}

export default function NodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNode();
  }, [id]);

  const fetchNode = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/nodes/${id}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching node:', error);
      Alert.alert('Error', 'Failed to load node');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Node',
      'Are you sure you want to delete this node? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${EXPO_PUBLIC_BACKEND_URL}/api/nodes/${id}`);
              router.back();
            } catch (error) {
              console.error('Error deleting node:', error);
              Alert.alert('Error', 'Failed to delete node');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Node not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { node, connections } = data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Node Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Node Card */}
        <View style={styles.mainCard}>
          <View style={styles.nodeHeader}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: TYPE_COLORS[node.type] || COLORS.accent },
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(node.createdAt)}</Text>
          </View>

          <Text style={styles.nodeTitle}>{node.title}</Text>
          <Text style={styles.nodeContent}>{node.content}</Text>

          {node.source && (
            <View style={styles.sourceContainer}>
              <Ionicons name="link-outline" size={16} color={COLORS.accent} />
              <Text style={styles.sourceText} numberOfLines={1}>
                {node.source}
              </Text>
            </View>
          )}

          {node.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {node.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Connections Section */}
        <View style={styles.connectionsSection}>
          <Text style={styles.sectionTitle}>
            Connected Nodes ({connections.length})
          </Text>

          {connections.length === 0 ? (
            <View style={styles.emptyConnections}>
              <Ionicons name="git-network-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No connections yet</Text>
              <Text style={styles.emptySubtext}>
                Add more nodes to discover semantic connections
              </Text>
            </View>
          ) : (
            connections.map((connection, index) => (
              <TouchableOpacity
                key={index}
                style={styles.connectionCard}
                onPress={() => router.push(`/node-detail?id=${connection.node.id}`)}
              >
                <View style={styles.connectionHeader}>
                  <View
                    style={[
                      styles.smallTypeBadge,
                      { backgroundColor: TYPE_COLORS[connection.node.type] || COLORS.accent },
                    ]}
                  >
                    <Text style={styles.smallTypeBadgeText}>
                      {connection.node.type.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.connectionTitle} numberOfLines={1}>
                    {connection.node.title}
                  </Text>
                  <View style={styles.similarityBadge}>
                    <Text style={styles.similarityText}>
                      {Math.round(connection.similarityScore * 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.connectionContent} numberOfLines={2}>
                  {connection.node.content}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 16,
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
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textLight,
  },
  backLink: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },
  backLinkText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 20,
    padding: 24,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  nodeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  nodeContent: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 8,
  },
  sourceText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.accent,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(74, 157, 140, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  connectionsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 16,
  },
  emptyConnections: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  connectionCard: {
    backgroundColor: 'rgba(245, 245, 240, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  smallTypeBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallTypeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  connectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  similarityBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  similarityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  connectionContent: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
