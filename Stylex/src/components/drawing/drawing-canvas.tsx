import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Color, DrawingState, DrawingTool } from '@/domain/artwork';
import { useTheme } from '@/hooks/use-theme';

export type DrawingCanvasProps = {
  drawing: DrawingState;
  selectedTool: DrawingTool;
  selectedColor: Color;
};

/**
 * Presentation boundary for the canvas. Input and rendering are intentionally
 * deferred until Step 2; the route already passes typed drawing state here.
 */
export function DrawingCanvas({ drawing, selectedTool, selectedColor }: DrawingCanvasProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Drawing canvas"
      style={[
        styles.canvas,
        {
          aspectRatio: drawing.canvas.width / drawing.canvas.height,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <View style={[styles.preview, { borderColor: selectedColor }]}>
        <ThemedText type="subtitle" style={styles.centerText}>
          New canvas
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          {drawing.canvas.width} × {drawing.canvas.height}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {selectedTool === 'fill' ? 'Fill' : selectedTool === 'erase' ? 'Eraser' : 'Draw'} tool ready
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    maxWidth: 720,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  preview: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centerText: { textAlign: 'center' },
});
