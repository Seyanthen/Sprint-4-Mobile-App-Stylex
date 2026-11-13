import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ArtworkPreview } from '@/components/drawing/artwork-preview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import type { Artwork } from '@/domain/artwork';
import { deleteArtwork, listArtworks } from '@/storage/artwork-storage';

export default function GalleryScreen() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadArtworks = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true); else setIsLoading(true);
    setErrorMessage('');
    try { setArtworks(await listArtworks()); }
    catch { setErrorMessage('Unable to load the local gallery. Your saved artwork was not changed.'); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadArtworks(); }, [loadArtworks]));

  const confirmDelete = (artwork: Artwork) => {
    Alert.alert('Delete artwork?', `“${artwork.title}” will be removed from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteArtwork(artwork.id);
          setArtworks((current) => current.filter((candidate) => candidate.id !== artwork.id));
        } catch { setErrorMessage('Unable to delete that artwork locally.'); }
      } },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadArtworks(true)} />}>
          <ThemedText type="title">Gallery</ThemedText>
          <ThemedText themeColor="textSecondary">Your saved artwork stays on this device.</ThemedText>
          {isLoading ? <View style={styles.centered}><ActivityIndicator /><ThemedText>Loading gallery…</ThemedText></View>
            : errorMessage ? <ThemedView type="backgroundElement" style={styles.stateCard}>
              <ThemedText type="subtitle">Gallery unavailable</ThemedText><ThemedText themeColor="textSecondary">{errorMessage}</ThemedText>
              <Pressable accessibilityRole="button" onPress={() => loadArtworks(true)} style={styles.actionButton}><ThemedText style={styles.actionButtonText}>Try again</ThemedText></Pressable>
            </ThemedView>
            : artworks.length === 0 ? <ThemedView type="backgroundElement" style={styles.stateCard}>
              <ThemedText type="subtitle">Your gallery is empty</ThemedText><ThemedText themeColor="textSecondary">Save a drawing from New Drawing and it will appear here.</ThemedText>
            </ThemedView>
            : <View style={styles.grid}>{artworks.map((artwork) => <ThemedView type="backgroundElement" key={artwork.id} style={styles.card}>
              <ArtworkPreview artwork={artwork} />
              <ThemedText type="subtitle" numberOfLines={1}>{artwork.title}</ThemedText>
              <ThemedText themeColor="textSecondary">Updated {new Date(artwork.updatedAt).toLocaleDateString()}</ThemedText>
              <View style={styles.cardActions}>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/', params: { artworkId: artwork.id } })} style={styles.actionButton}><ThemedText style={styles.actionButtonText}>Open</ThemedText></Pressable>
                <Pressable accessibilityRole="button" onPress={() => confirmDelete(artwork)} style={styles.deleteButton}><ThemedText style={styles.deleteButtonText}>Delete</ThemedText></Pressable>
              </View>
            </ThemedView>)}</View>}
        </ScrollView>
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
  },
  content: { padding: Spacing.four, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three },
  centered: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  stateCard: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.two },
  grid: { gap: Spacing.three },
  card: { padding: Spacing.two, borderRadius: Spacing.three, gap: Spacing.two },
  cardActions: { flexDirection: 'row', gap: Spacing.two },
  actionButton: { backgroundColor: '#2563EB', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 10, alignSelf: 'flex-start' },
  actionButtonText: { color: '#FFFFFF' },
  deleteButton: { borderWidth: 1, borderColor: '#B91C1C', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 10, alignSelf: 'flex-start' },
  deleteButtonText: { color: '#B91C1C' },
});
