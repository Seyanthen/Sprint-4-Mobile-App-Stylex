import { SafeAreaView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function GalleryScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Gallery</ThemedText>
        <ThemedView type="backgroundElement" style={styles.emptyState}>
          <ThemedText type="subtitle">Your gallery is empty</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            Saved artwork will appear here once local persistence is added.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  emptyState: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.two },
  centerText: { textAlign: 'center' },
});
