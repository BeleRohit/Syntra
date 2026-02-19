import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#0a1628',
  card: '#f5f5f0',
  accent: '#4a9d8c',
  text: '#0a1628',
  textLight: '#f5f5f0',
  textMuted: '#6b7280',
};

export default function HomeScreen() {
  const menuItems = [
    {
      id: 'add',
      title: 'Add Node',
      subtitle: 'Create a new knowledge node',
      icon: 'add-circle-outline',
      route: '/add-node',
    },
    {
      id: 'search',
      title: 'Search',
      subtitle: 'Semantic search your knowledge',
      icon: 'search-outline',
      route: '/search',
    },
    {
      id: 'graph',
      title: 'Knowledge Graph',
      subtitle: 'Visualize your connected thoughts',
      icon: 'git-network-outline',
      route: '/graph',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>SYNTRA</Text>
        <Text style={styles.tagline}>Where thoughts become threads</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={32} color={COLORS.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Your personal knowledge operating system</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 8,
    letterSpacing: 1,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 157, 140, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
