import { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import type { Color, DrawingState, DrawingTool, Point, Stroke } from '@/domain/artwork';
import { useTheme } from '@/hooks/use-theme';

export type DrawingCanvasProps = {
  drawing: DrawingState;
  selectedTool: DrawingTool;
  selectedColor: Color;
  onStrokeComplete: (points: Point[]) => void;
  onFill: () => void;
};

const DEFAULT_STROKE_WIDTH = 14;

function getPoint(event: GestureResponderEvent, width: number, height: number, canvas: DrawingState['canvas']): Point {
  return {
    x: Math.max(0, Math.min(canvas.width, (event.nativeEvent.locationX / Math.max(width, 1)) * canvas.width)),
    y: Math.max(0, Math.min(canvas.height, (event.nativeEvent.locationY / Math.max(height, 1)) * canvas.height)),
  };
}

function Segment({ from, to, color, width, scale }: { from: Point; to: Point; color: Color; width: number; scale: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy) * scale;
  const angle = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;

  return (
    <View
      pointerEvents="none"
      style={[styles.segment, {
        width: Math.max(length, width * scale),
        height: Math.max(width * scale, 2),
        left: from.x * scale,
        top: from.y * scale - width * scale / 2,
        backgroundColor: color,
        transform: [{ rotate: angle }],
      }]}
    />
  );
}

export function DrawingCanvas({ drawing, selectedTool, selectedColor, onStrokeComplete, onFill }: DrawingCanvasProps) {
  const theme = useTheme();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const activePointsRef = useRef<Point[]>([]);
  const [previewPoints, setPreviewPoints] = useState<Point[]>([]);
  const scale = layout.width / drawing.canvas.width;
  const fillColor = drawing.fills.at(-1)?.color ?? theme.backgroundElement;

  const finishStroke = () => {
    if (activePointsRef.current.length > 0) onStrokeComplete(activePointsRef.current);
    activePointsRef.current = [];
    setPreviewPoints([]);
  };

  const handleResponderGrant = (event: GestureResponderEvent) => {
      if (selectedTool === 'fill') {
        onFill();
        return;
      }
      const point = getPoint(event, layout.width, layout.height, drawing.canvas);
      activePointsRef.current = [point];
      setPreviewPoints([point]);
  };

  const handleResponderMove = (event: GestureResponderEvent) => {
      if (selectedTool === 'fill') return;
      const point = getPoint(event, layout.width, layout.height, drawing.canvas);
      activePointsRef.current = [...activePointsRef.current, point];
      setPreviewPoints([...activePointsRef.current]);
  };

  const renderStroke = (stroke: Stroke) => {
    const color = stroke.tool === 'erase' ? fillColor : stroke.color;
    const points = stroke.points.length === 1 ? [stroke.points[0], stroke.points[0]] : stroke.points;
    return points.slice(1).map((point, segmentIndex) => (
      <Segment key={`${stroke.id}-${segmentIndex}`} from={points[segmentIndex]} to={point} color={color} width={stroke.width} scale={scale} />
    ));
  };

  return (
    <View
      accessibilityLabel="Drawing canvas"
      accessibilityRole="image"
      onLayout={(event: LayoutChangeEvent) => setLayout(event.nativeEvent.layout)}
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => selectedTool !== 'fill'}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleResponderGrant}
      onResponderMove={handleResponderMove}
      onResponderRelease={finishStroke}
      onResponderTerminate={finishStroke}
      style={[styles.canvas, {
        aspectRatio: drawing.canvas.width / drawing.canvas.height,
        backgroundColor: fillColor,
        borderColor: theme.backgroundSelected,
      }]}
    >
      {scale > 0 && drawing.strokes.map(renderStroke)}
      {scale > 0 && previewPoints.length > 0 && renderStroke({
        id: 'preview',
        points: previewPoints,
        color: selectedTool === 'draw' ? '#111827' : selectedColor,
        width: DEFAULT_STROKE_WIDTH,
        tool: selectedTool === 'erase' ? 'erase' : 'color',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    maxWidth: 720,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    borderRadius: 999,
  },
});
