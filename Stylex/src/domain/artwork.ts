/** A coordinate pair in the artwork's fixed canvas coordinate system. */
export type Point = {
  x: number;
  y: number;
};

/** Width and height are stored independently from the device viewport. */
export type CanvasDimensions = {
  width: number;
  height: number;
};

/** Colors are serialized as CSS-compatible values, such as #2563eb or rgba(...). */
export type Color = string;

export type DrawingTool = 'draw' | 'erase' | 'fill';

export type Stroke = {
  id: string;
  points: Point[];
  color: Color;
  width: number;
  opacity: number;
  tool: Extract<DrawingTool, 'draw' | 'erase'>;
};

export type BrushSettings = {
  size: number;
  opacity: number;
};

export type FillOperation = {
  id: string;
  origin: Point;
  color: Color;
  rectangles: FillRectangle[];
};

export type FillRectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DrawingOperation =
  | { type: 'stroke'; stroke: Stroke }
  | { type: 'fill'; fill: FillOperation };

export type DrawingLayer = {
  id: string;
  name: string;
  visible: boolean;
  operations: DrawingOperation[];
};

/** The serializable vector representation used by the drawing engine and storage layer. */
export type DrawingState = {
  canvas: CanvasDimensions;
  layers: DrawingLayer[];
  activeLayerId: string;
};

export type Artwork = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  drawing: DrawingState;
};

export const DEFAULT_CANVAS_DIMENSIONS: CanvasDimensions = {
  width: 1024,
  height: 768,
};

export function createEmptyDrawingState(
  canvas: CanvasDimensions = DEFAULT_CANVAS_DIMENSIONS,
): DrawingState {
  const layer = createLayer('layer-1', 'Layer 1');
  return { canvas, layers: [layer], activeLayerId: layer.id };
}

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = { size: 14, opacity: 1 };

export function createLayer(id: string, name: string): DrawingLayer {
  return { id, name, visible: true, operations: [] };
}

export function getActiveLayer(drawing: DrawingState): DrawingLayer {
  return drawing.layers.find((layer) => layer.id === drawing.activeLayerId) ?? drawing.layers[0];
}

export function getVisibleOperations(drawing: DrawingState): DrawingOperation[] {
  return drawing.layers.filter((layer) => layer.visible).flatMap((layer) => layer.operations);
}

const FLOOD_FILL_COLUMNS = 128;

function getFloodFillRows(canvas: CanvasDimensions): number {
  return Math.max(1, Math.round(FLOOD_FILL_COLUMNS * canvas.height / canvas.width));
}

function getCellSize(canvas: CanvasDimensions, rows: number): { width: number; height: number } {
  return {
    width: canvas.width / FLOOD_FILL_COLUMNS,
    height: canvas.height / rows,
  };
}

function getCell(point: Point, canvas: CanvasDimensions, rows: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(FLOOD_FILL_COLUMNS - 1, Math.floor(point.x / canvas.width * FLOOD_FILL_COLUMNS))),
    y: Math.max(0, Math.min(rows - 1, Math.floor(point.y / canvas.height * rows))),
  };
}

function markStroke(grid: Uint8Array, stroke: Stroke, canvas: CanvasDimensions, rows: number): void {
  const cellSize = getCellSize(canvas, rows);
  const radius = Math.max(0, Math.ceil(stroke.width / Math.min(cellSize.width, cellSize.height) / 2));
  const points = stroke.points.length === 1 ? [stroke.points[0], stroke.points[0]] : stroke.points;

  const markPoint = (point: Point) => {
    const cell = getCell(point, canvas, rows);
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        const x = cell.x + offsetX;
        const y = cell.y + offsetY;
        if (x >= 0 && x < FLOOD_FILL_COLUMNS && y >= 0 && y < rows) {
          grid[y * FLOOD_FILL_COLUMNS + x] = stroke.tool === 'erase' ? 0 : 1;
        }
      }
    }
  };

  points.forEach((point, pointIndex) => {
    const previousPoint = points[Math.max(0, pointIndex - 1)];
    const distance = Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
    const steps = Math.max(1, Math.ceil(distance / Math.min(cellSize.width, cellSize.height)));
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      markPoint({
        x: previousPoint.x + (point.x - previousPoint.x) * progress,
        y: previousPoint.y + (point.y - previousPoint.y) * progress,
      });
    }
  });
}

/** Creates a serializable, tap-based flood fill from the current vector operations. */
export function createRegionFill(
  drawing: DrawingState,
  origin: Point,
  color: Color,
): FillOperation {
  const rows = getFloodFillRows(drawing.canvas);
  const totalCells = FLOOD_FILL_COLUMNS * rows;
  const blocked = new Uint8Array(totalCells);

  getVisibleOperations(drawing).forEach((operation) => {
    if (operation.type === 'stroke') markStroke(blocked, operation.stroke, drawing.canvas, rows);
  });

  const start = getCell(origin, drawing.canvas, rows);
  const startIndex = start.y * FLOOD_FILL_COLUMNS + start.x;
  const filled = new Uint8Array(totalCells);
  const queue = [startIndex];
  if (blocked[startIndex]) {
    return { id: '', origin, color, rectangles: [] };
  }

  filled[startIndex] = 1;
  while (queue.length > 0) {
    const current = queue.shift() as number;
    const x = current % FLOOD_FILL_COLUMNS;
    const y = Math.floor(current / FLOOD_FILL_COLUMNS);
    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
    ];

    neighbors.forEach(([neighborX, neighborY]) => {
      if (neighborX < 0 || neighborX >= FLOOD_FILL_COLUMNS || neighborY < 0 || neighborY >= rows) return;
      const neighborIndex = neighborY * FLOOD_FILL_COLUMNS + neighborX;
      if (!blocked[neighborIndex] && !filled[neighborIndex]) {
        filled[neighborIndex] = 1;
        queue.push(neighborIndex);
      }
    });
  }

  const cellSize = getCellSize(drawing.canvas, rows);
  const rectangles: FillRectangle[] = [];
  for (let y = 0; y < rows; y += 1) {
    let runStart = -1;
    for (let x = 0; x <= FLOOD_FILL_COLUMNS; x += 1) {
      const isFilled = x < FLOOD_FILL_COLUMNS && filled[y * FLOOD_FILL_COLUMNS + x] === 1;
      if (isFilled && runStart < 0) runStart = x;
      if ((!isFilled || x === FLOOD_FILL_COLUMNS) && runStart >= 0) {
        rectangles.push({
          x: runStart * cellSize.width,
          y: y * cellSize.height,
          width: (x - runStart) * cellSize.width,
          height: cellSize.height,
        });
        runStart = -1;
      }
    }
  }

  return { id: '', origin, color, rectangles };
}
