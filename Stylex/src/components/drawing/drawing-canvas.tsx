import { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import type { Color, DrawingOperation, DrawingState, DrawingTool, Point, Stroke } from '@/domain/artwork';
import { useTheme } from '@/hooks/use-theme';

export type DrawingCanvasProps = {
  drawing: DrawingState;
  selectedTool: DrawingTool;
  selectedColor: Color;
  onStrokeComplete: (points: Point[]) => void;
  onFill: (origin: Point) => void;
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
  const baseColor = theme.backgroundElement;

  const finishStroke = () => {
    if (activePointsRef.current.length > 0) onStrokeComplete(activePointsRef.current);
    activePointsRef.current = [];
    setPreviewPoints([]);
  };

  const handleResponderGrant = (event: GestureResponderEvent) => {
      const point = getPoint(event, layout.width, layout.height, drawing.canvas);
      if (selectedTool === 'fill') {
        onFill(point);
        return;
      }
      activePointsRef.current = [point];
      setPreviewPoints([point]);
  };

  const handleResponderMove = (event: GestureResponderEvent) => {
      if (selectedTool === 'fill') return;
      const point = getPoint(event, layout.width, layout.height, drawing.canvas);
      activePointsRef.current = [...activePointsRef.current, point];
      setPreviewPoints([...activePointsRef.current]);
  };

  const renderStroke = (stroke: Stroke, eraseColor: Color) => {
    const color = stroke.tool === 'erase' ? eraseColor : stroke.color;
    const points = stroke.points.length === 1 ? [stroke.points[0], stroke.points[0]] : stroke.points;
    return points.slice(1).map((point, segmentIndex) => (
      <Segment key={`${stroke.id}-${segmentIndex}`} from={points[segmentIndex]} to={point} color={color} width={stroke.width} scale={scale} />
    ));
  };

  const renderOperation = (operation: DrawingOperation, operationIndex: number) => {
    if (operation.type === 'fill') {
      return operation.fill.rectangles.map((rectangle, rectangleIndex) => (
        <View
          key={`${operation.fill.id}-${rectangleIndex}`}
          pointerEvents="none"
          accessibilityLabel={rectangleIndex === 0 ? `Canvas region filled with ${operation.fill.color}` : undefined}
          style={[styles.fill, {
            backgroundColor: operation.fill.color,
            left: rectangle.x * scale,
            top: rectangle.y * scale,
            width: rectangle.width * scale,
            height: rectangle.height * scale,
          }]}
        />
      ));
    }

    const eraseColor = drawing.operations
      .slice(0, operationIndex)
      .reduce<Color>((color, previousOperation) => (
        previousOperation.type === 'fill' ? previousOperation.fill.color : color
      ), baseColor);

    return renderStroke(operation.stroke, eraseColor);
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
        backgroundColor: baseColor,
        borderColor: theme.backgroundSelected,
      }]}
    >
      {scale > 0 && drawing.operations.map(renderOperation)}
      {scale > 0 && previewPoints.length > 0 && renderStroke({
        id: 'preview',
        points: previewPoints,
        color: selectedColor,
        width: DEFAULT_STROKE_WIDTH,
        tool: selectedTool === 'erase' ? 'erase' : 'draw',
      }, drawing.operations
        .reduce<Color>((color, operation) => (
          operation.type === 'fill' ? operation.fill.color : color
        ), baseColor))}
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
  fill: {
    position: 'absolute',
  },
});
