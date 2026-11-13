import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';

import { getVisibleOperations, type Artwork, type Stroke } from '@/domain/artwork';
import { useTheme } from '@/hooks/use-theme';
import { loadSkiaWeb } from './skia-web';

type ArtworkPreviewProps = { artwork: Artwork };

function createPath(stroke: Stroke) {
  const commands = stroke.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`);
  if (stroke.points.length === 1) commands.push(`L ${stroke.points[0].x} ${stroke.points[0].y}`);
  return Skia.Path.MakeFromSVGString(commands.join(' ')) ?? Skia.Path.Make();
}

export function ArtworkPreview({ artwork }: ArtworkPreviewProps) {
  const theme = useTheme();
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== 'web');
  const scale = 1 / Math.max(artwork.drawing.canvas.width, artwork.drawing.canvas.height);

  useEffect(() => {
    if (Platform.OS === 'web') loadSkiaWeb().then(() => setSkiaReady(true));
  }, []);

  const operations = getVisibleOperations(artwork.drawing);
  const paths = useMemo(() => operations.map((operation) => {
    if (operation.type !== 'stroke') return null;
    return { stroke: operation.stroke, path: createPath(operation.stroke) };
  }), [operations]);

  if (!skiaReady) return <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]} />;

  return (
    <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={[{ scale }]}>
          <Rect x={0} y={0} width={artwork.drawing.canvas.width} height={artwork.drawing.canvas.height} color={theme.backgroundElement} />
          {operations.map((operation) => operation.type === 'fill'
            ? operation.fill.rectangles.map((rectangle, index) => (
              <Rect key={`${operation.fill.id}-${index}`} {...rectangle} color={operation.fill.color} />
            ))
            : null)}
          {paths.map((entry) => entry && (
            <Path
              key={entry.stroke.id}
              path={entry.path}
              style="stroke"
              color={entry.stroke.tool === 'erase' ? undefined : entry.stroke.color}
              strokeWidth={entry.stroke.width}
              strokeCap="round"
              strokeJoin="round"
              blendMode={entry.stroke.tool === 'erase' ? 'clear' : undefined}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10, overflow: 'hidden' },
});
