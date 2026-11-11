import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { DrawingCanvas } from '@/components/drawing/drawing-canvas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { createEmptyDrawingState, createRegionFill, type Color, type DrawingTool, type Point } from '@/domain/artwork';

const DEFAULT_COLOR: Color = '#2563EB';

export default function NewDrawingScreen() {
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('draw');
  const [selectedColor, setSelectedColor] = useState<Color>(DEFAULT_COLOR);
  const [drawing, setDrawing] = useState(() => createEmptyDrawingState());

  const addStroke = (points: Point[]) => {
    if (selectedTool === 'fill') return;
    setDrawing((current) => ({
      ...current,
      operations: [...current.operations, {
        type: 'stroke',
        stroke: {
          id: `stroke-${Date.now()}-${current.operations.length}`,
          points,
          color: selectedColor,
          width: 14,
          tool: selectedTool,
        },
      }],
    }));
  };

  const fillCanvas = (origin: Point) => {
    setDrawing((current) => ({
      ...current,
      operations: (() => {
        const fill = createRegionFill(current, origin, selectedColor);
        if (fill.rectangles.length === 0) return current.operations;
        return [...current.operations, {
          type: 'fill' as const,
          fill: { ...fill, id: `fill-${Date.now()}-${current.operations.length}` },
        }];
      })(),
    }));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">New Drawing</ThemedText>
          <ThemedText themeColor="textSecondary">
            Draw with the selected color, erase, and fill on a fixed canvas.
          </ThemedText>

          <DrawingCanvas
            drawing={drawing}
            selectedTool={selectedTool}
            selectedColor={selectedColor}
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
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
