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

export type DrawingTool = 'draw' | 'color' | 'erase' | 'fill';

export type Stroke = {
  id: string;
  points: Point[];
  color: Color;
  width: number;
  tool: Extract<DrawingTool, 'draw' | 'color' | 'erase'>;
};

export type FillOperation = {
  id: string;
  origin: Point;
  color: Color;
};

/** The serializable vector representation used by the drawing engine and storage layer. */
export type DrawingState = {
  canvas: CanvasDimensions;
  strokes: Stroke[];
  fills: FillOperation[];
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
  return { canvas, strokes: [], fills: [] };
}
