import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { DrawingCanvas } from '@/components/drawing/drawing-canvas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { createEmptyDrawingState, type Color, type DrawingTool } from '@/domain/artwork';

const DEFAULT_COLOR: Color = '#2563EB';

export default function NewDrawingScreen() {
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('draw');
  const [selectedColor] = useState<Color>(DEFAULT_COLOR);
  const [drawing] = useState(() => createEmptyDrawingState());

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">New Drawing</ThemedText>
          <ThemedText themeColor="textSecondary">
            Start with a fixed canvas. Drawing tools will be added in the next step.
          </ThemedText>

          <DrawingCanvas
            drawing={drawing}
            selectedTool={selectedTool}
            selectedColor={selectedColor}
          />

          <ThemedView type="backgroundElement" style={styles.toolPanel}>
            <ThemedText type="smallBold">Drawing tools</ThemedText>
            <View style={styles.toolRow}>
              {(['draw', 'erase', 'fill'] as const).map((tool) => (
                <Pressable
                  key={tool}
                  accessibilityRole="button"
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
});
