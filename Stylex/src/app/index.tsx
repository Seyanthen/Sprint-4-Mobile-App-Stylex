import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { DrawingCanvas } from '@/components/drawing/drawing-canvas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { createEmptyDrawingState, createLayer, createRegionFill, type Artwork, type BrushSettings, type Color, type DrawingTool, type Point } from '@/domain/artwork';
import { createArtworkId, readArtwork, saveArtwork } from '@/storage/artwork-storage';

const DEFAULT_COLOR: Color = '#2563EB';
const DEFAULT_BRUSH: BrushSettings = { size: 14, opacity: 1 };

export default function NewDrawingScreen() {
  const { artworkId } = useLocalSearchParams<{ artworkId?: string }>();
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('draw');
  const [selectedColor, setSelectedColor] = useState<Color>(DEFAULT_COLOR);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>(DEFAULT_BRUSH);
  const [drawing, setDrawing] = useState(() => createEmptyDrawingState());
  const [title, setTitle] = useState('Untitled Drawing');
  const [savedArtwork, setSavedArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(artworkId));
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!artworkId) return;
    let active = true;
    setIsLoading(true);
    readArtwork(artworkId)
      .then((artwork) => {
        if (!active) return;
        if (!artwork) {
          setErrorMessage('That artwork could not be found in local storage.');
        } else {
          setSavedArtwork(artwork);
          setTitle(artwork.title);
          setDrawing(artwork.drawing);
        }
      })
      .catch(() => active && setErrorMessage('Unable to load the saved artwork from local storage.'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [artworkId]);

  const addStroke = (points: Point[]) => {
    if (selectedTool === 'fill') return;
    setDrawing((current) => ({
      ...current,
      layers: current.layers.map((layer) => layer.id === current.activeLayerId
        ? { ...layer, operations: [...layer.operations, {
          type: 'stroke' as const,
          stroke: {
            id: `stroke-${Date.now()}-${layer.operations.length}`,
            points,
            color: selectedColor,
            width: brushSettings.size,
            opacity: brushSettings.opacity,
            tool: selectedTool,
          },
        }] }
        : layer),
    }));
  };

  const fillCanvas = (origin: Point) => {
    setDrawing((current) => ({
      ...current,
      layers: current.layers.map((layer) => layer.id === current.activeLayerId ? { ...layer, operations: (() => {
        const fill = createRegionFill(current, origin, selectedColor);
        if (fill.rectangles.length === 0) return layer.operations;
        return [...layer.operations, {
          type: 'fill' as const,
          fill: { ...fill, id: `fill-${Date.now()}-${layer.operations.length}` },
        }];
      })() } : layer),
    }));
  };

  const addLayer = () => setDrawing((current) => {
    const layer = createLayer(`layer-${Date.now()}`, `Layer ${current.layers.length + 1}`);
    return { ...current, layers: [...current.layers, layer], activeLayerId: layer.id };
  });

  const removeActiveLayer = () => setDrawing((current) => {
    if (current.layers.length <= 1) return current;
    const index = current.layers.findIndex((layer) => layer.id === current.activeLayerId);
    const nextLayers = current.layers.filter((layer) => layer.id !== current.activeLayerId);
    const nextActive = nextLayers[Math.max(0, index - 1)] ?? nextLayers[0];
    return { ...current, layers: nextLayers, activeLayerId: nextActive.id };
  });

  const toggleLayer = (layerId: string) => setDrawing((current) => ({
    ...current,
    layers: current.layers.map((layer) => layer.id === layerId ? { ...layer, visible: !layer.visible } : layer),
  }));

  const moveLayer = (layerId: string, direction: -1 | 1) => setDrawing((current) => {
    const index = current.layers.findIndex((layer) => layer.id === layerId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= current.layers.length) return current;
    const layers = [...current.layers];
    [layers[index], layers[nextIndex]] = [layers[nextIndex], layers[index]];
    return { ...current, layers };
  });

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage('');
    setErrorMessage('');
    const now = new Date().toISOString();
    const artwork: Artwork = {
      id: savedArtwork?.id ?? createArtworkId(),
      title: title.trim() || 'Untitled Drawing',
      createdAt: savedArtwork?.createdAt ?? now,
      updatedAt: now,
      drawing,
    };
    try {
      await saveArtwork(artwork);
      setSavedArtwork(artwork);
      setTitle(artwork.title);
      setStatusMessage('Saved locally.');
    } catch {
      setErrorMessage('Unable to save this artwork locally. Your changes are still on screen.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ThemedView style={styles.centered}><ActivityIndicator /><ThemedText>Loading artwork…</ThemedText></ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">New Drawing</ThemedText>
          <ThemedText themeColor="textSecondary">
            Draw with the selected color, erase, and fill on a fixed canvas.
          </ThemedText>

          <View style={styles.saveRow}>
            <TextInput
              accessibilityLabel="Artwork title"
              value={title}
              onChangeText={setTitle}
              placeholder="Artwork title"
              placeholderTextColor="#60646C"
              style={styles.titleInput}
            />
            <Pressable accessibilityRole="button" disabled={isSaving} onPress={handleSave} style={styles.saveButton}>
              {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.saveButtonText}>Save</ThemedText>}
            </Pressable>
          </View>
          {statusMessage ? <ThemedText themeColor="textSecondary">{statusMessage}</ThemedText> : null}
          {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}

          <DrawingCanvas
            drawing={drawing}
            selectedTool={selectedTool}
            selectedColor={selectedColor}
            brushSettings={brushSettings}
            onStrokeComplete={addStroke}
            onFill={fillCanvas}
          />

          <ThemedView type="backgroundElement" style={styles.toolPanel}>
            <ThemedText type="smallBold">Drawing tools</ThemedText>
            <View style={styles.toolRow}>
              {(['draw', 'erase', 'fill'] as const).map((tool) => (
                <Pressable
                  key={tool}
                  accessibilityRole="button"
                  accessibilityLabel={`${tool === 'draw' ? 'Draw' : tool === 'erase' ? 'Erase' : 'Fill'} tool`}
                  accessibilityState={{ selected: selectedTool === tool }}
                  onPress={() => setSelectedTool(tool)}
                  style={[styles.toolButton, selectedTool === tool && styles.selectedTool]}>
                  <ThemedText type="small">
                    {tool === 'draw' ? 'Draw' : tool === 'erase' ? 'Erase' : 'Fill'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: selectedColor }]} />
              <ThemedText themeColor="textSecondary">Selected color {selectedColor}</ThemedText>
            </View>
            <View style={styles.colorRow}>
              {(['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#111827'] as const).map((color) => (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${color}`}
                  accessibilityState={{ selected: selectedColor === color }}
                  onPress={() => setSelectedColor(color)}>
                  <View style={[styles.paletteSwatch, { backgroundColor: color }, selectedColor === color && styles.selectedSwatch]} />
                </Pressable>
              ))}
            </View>
            <ThemedText type="smallBold">Brush</ThemedText>
            <View style={styles.toolRow}>
              <Pressable accessibilityRole="button" onPress={() => setBrushSettings((current) => ({ ...current, size: Math.max(4, current.size - 4) }))} style={styles.toolButton}><ThemedText type="small">Smaller</ThemedText></Pressable>
              <ThemedText themeColor="textSecondary">Size {brushSettings.size}px</ThemedText>
              <Pressable accessibilityRole="button" onPress={() => setBrushSettings((current) => ({ ...current, size: Math.min(64, current.size + 4) }))} style={styles.toolButton}><ThemedText type="small">Larger</ThemedText></Pressable>
            </View>
            <View style={styles.toolRow}>
              {[1, 0.75, 0.5].map((opacity) => <Pressable key={opacity} accessibilityRole="button" accessibilityState={{ selected: brushSettings.opacity === opacity }} onPress={() => setBrushSettings((current) => ({ ...current, opacity }))} style={[styles.toolButton, brushSettings.opacity === opacity && styles.selectedTool]}><ThemedText type="small">{opacity * 100}%</ThemedText></Pressable>)}
            </View>
            <View style={styles.layerHeader}><ThemedText type="smallBold">Layers</ThemedText><Pressable accessibilityRole="button" onPress={addLayer} style={styles.smallButton}><ThemedText style={styles.actionButtonText}>Add layer</ThemedText></Pressable></View>
            {drawing.layers.map((layer, index) => <View key={layer.id} style={styles.layerRow}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: layer.id === drawing.activeLayerId }} onPress={() => setDrawing((current) => ({ ...current, activeLayerId: layer.id }))} style={[styles.layerName, layer.id === drawing.activeLayerId && styles.selectedTool]}><ThemedText type="small">{layer.name}</ThemedText></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`${layer.visible ? 'Hide' : 'Show'} ${layer.name}`} onPress={() => toggleLayer(layer.id)}><ThemedText type="small">{layer.visible ? 'Hide' : 'Show'}</ThemedText></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Move ${layer.name} up`} disabled={index === 0} onPress={() => moveLayer(layer.id, -1)}><ThemedText type="small">↑</ThemedText></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Move ${layer.name} down`} disabled={index === drawing.layers.length - 1} onPress={() => moveLayer(layer.id, 1)}><ThemedText type="small">↓</ThemedText></Pressable>
              <Pressable accessibilityRole="button" disabled={drawing.layers.length <= 1} onPress={removeActiveLayer}><ThemedText type="small">Remove</ThemedText></Pressable>
            </View>)}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  toolPanel: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  toolRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  toolButton: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 20 },
  selectedTool: { backgroundColor: '#C7D2FE' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  colorSwatch: { width: 24, height: 24, borderRadius: 12 },
  paletteSwatch: { width: 28, height: 28, borderRadius: 14, marginRight: Spacing.two },
  selectedSwatch: { borderWidth: 3, borderColor: '#FFFFFF' },
  saveRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  titleInput: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#A1A1AA', borderRadius: 10, paddingHorizontal: Spacing.two, color: '#111827' },
  saveButton: { minHeight: 44, paddingHorizontal: Spacing.three, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF' },
  errorText: { color: '#B91C1C' },
  layerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  layerName: { flex: 1, minWidth: 100, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 8 },
  smallButton: { backgroundColor: '#2563EB', paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 8 },
  actionButtonText: { color: '#FFFFFF' },
});
