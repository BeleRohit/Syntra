import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
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
  border: '#e5e5e5',
  error: '#ef4444',
};

const NODE_TYPES = ['book', 'note', 'article', 'quote', 'idea'];

export default function AddNodeScreen() {
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    setLoading(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/nodes`, {
        type,
        title: title.trim(),
        content: content.trim(),
        source: source.trim() || null,
        tags: tagsArray,
      });

      const connectionsCount = response.data.connections?.length || 0;
      Alert.alert(
        'Success',
        `Node created! ${connectionsCount} connection${connectionsCount !== 1 ? 's' : ''} found.`,
        [
          {
            text: 'View Details',
            onPress: () => router.push(`/node-detail?id=${response.data.node.id}`),
          },
          {
            text: 'Add Another',
            onPress: () => {
              setTitle('');
              setContent('');
              setSource('');
              setTags('');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating node:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create node');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Node</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeSelector}
              >
                {NODE_TYPES.map((nodeType) => (
                  <TouchableOpacity
                    key={nodeType}
                    style={[
                      styles.typeButton,
                      type === nodeType && styles.typeButtonActive,
                    ]}
                    onPress={() => setType(nodeType)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === nodeType && styles.typeButtonTextActive,
                      ]}
                    >
                      {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter title..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Content */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.contentInput]}
                value={content}
                onChangeText={setContent}
                placeholder="Enter your thoughts..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Source */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Source (optional)</Text>
              <TextInput
                style={styles.input}
                value={source}
                onChangeText={setSource}
                placeholder="URL or reference..."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
            </View>

            {/* Tags */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={tags}
                onChangeText={setTags}
                placeholder="philosophy, science, personal..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textLight} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.saveButtonText}>Save Node</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: COLORS.accent,
  },
  typeButtonText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  typeButtonTextActive: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  contentInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});
