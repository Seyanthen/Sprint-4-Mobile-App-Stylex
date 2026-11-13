import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';

import type { BrushSettings, DrawingState, DrawingTool, Point, Stroke } from '@/domain/artwork';
import { loadSkiaWeb } from './skia-web';
import { useTheme } from '@/hooks/use-theme';

export type DrawingCanvasProps = {
  drawing: DrawingState;
  selectedTool: DrawingTool;
  selectedColor: string;
  brushSettings: BrushSettings;
  onStrokeComplete: (points: Point[]) => void;
  onFill: (origin: Point) => void;
};

const DEFAULT_STROKE_WIDTH = 14;

function getPoint(
  event: GestureResponderEvent,
  width: number,
  height: number,
  canvas: DrawingState['canvas'],
): Point {
  return {
    x: Math.max(0, Math.min(canvas.width, (event.nativeEvent.locationX / Math.max(width, 1)) * canvas.width)),
    y: Math.max(0, Math.min(canvas.height, (event.nativeEvent.locationY / Math.max(height, 1)) * canvas.height)),
  };
}

function createPath(points: Point[]) {
  if (points.length === 0) return Skia.Path.Make();
  const commands = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`);
  if (points.length === 1) commands.push(`L ${points[0].x} ${points[0].y}`);
  return Skia.Path.MakeFromSVGString(commands.join(' ')) ?? Skia.Path.Make();
}

function StrokePath({ stroke, erase }: { stroke: Stroke; erase: boolean }) {
  const path = useMemo(() => createPath(stroke.points), [stroke.points]);
  return (
    <Path
      path={path}
      style="stroke"
      color={erase ? undefined : stroke.color}
      strokeWidth={stroke.width}
      opacity={stroke.opacity}
      strokeCap="round"
      strokeJoin="round"
      blendMode={erase ? 'clear' : undefined}
    />
  );
}

export function DrawingCanvas({ drawing, selectedTool, selectedColor, brushSettings, onStrokeComplete, onFill }: DrawingCanvasProps) {
  const theme = useTheme();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const activePointsRef = useRef<Point[]>([]);
  const [previewPoints, setPreviewPoints] = useState<Point[]>([]);
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== 'web');
  const scale = layout.width / drawing.canvas.width;

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadSkiaWeb().then(() => setSkiaReady(true));
    }
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

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
    const currentPoints = activePointsRef.current;
    const previousPoint = currentPoints[currentPoints.length - 1];
    const distance = previousPoint ? Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) : 0;
    const interpolationSteps = Math.max(1, Math.ceil(distance / (DEFAULT_STROKE_WIDTH / 2)));
    const interpolatedPoints = Array.from({ length: interpolationSteps }, (_, index) => {
      const progress = (index + 1) / interpolationSteps;
      return {
        x: (previousPoint?.x ?? point.x) + (point.x - (previousPoint?.x ?? point.x)) * progress,
        y: (previousPoint?.y ?? point.y) + (point.y - (previousPoint?.y ?? point.y)) * progress,
      };
    });
    activePointsRef.current = [...currentPoints, ...interpolatedPoints];
    setPreviewPoints([...activePointsRef.current]);
  };

  if (!skiaReady) {
    return <View accessibilityLabel="Drawing canvas loading" accessibilityRole="image" style={[styles.canvas, { backgroundColor: theme.backgroundElement }]} />;
  }

  return (
    <View
      accessibilityLabel="Drawing canvas"
      accessibilityRole="image"
      onLayout={handleLayout}
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
        backgroundColor: theme.backgroundElement,
        borderColor: theme.backgroundSelected,
      }]}
    >
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        {scale > 0 && (
          <Group transform={[{ scale }]}>
            <Rect x={0} y={0} width={drawing.canvas.width} height={drawing.canvas.height} color={theme.backgroundElement} />
            {drawing.layers.filter((layer) => layer.visible).flatMap((layer) => layer.operations).map((operation) => operation.type === 'fill'
              ? operation.fill.rectangles.map((rectangle, rectangleIndex) => (
                <Rect
                  key={`${operation.fill.id}-${rectangleIndex}`}
                  x={rectangle.x}
                  y={rectangle.y}
                  width={rectangle.width}
                  height={rectangle.height}
                  color={operation.fill.color}
                />
              ))
              : <StrokePath key={operation.stroke.id} stroke={operation.stroke} erase={operation.stroke.tool === 'erase'} />
            )}
            {previewPoints.length > 0 && selectedTool !== 'fill' && (
              <StrokePath
                stroke={{
                  id: 'preview',
                  points: previewPoints,
                  color: selectedColor,
                  width: brushSettings.size,
                  opacity: brushSettings.opacity,
                  tool: selectedTool,
                }}
                erase={selectedTool === 'erase'}
              />
            )}
          </Group>
        )}
      </Canvas>
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
});
