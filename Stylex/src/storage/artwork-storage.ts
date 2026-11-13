import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { createLayer, type Artwork, type DrawingOperation, type DrawingState } from '@/domain/artwork';

const STORAGE_KEY = 'stylex.artwork-records.v1';
const STORAGE_FILE = 'stylex-artwork-records.json';

type StoredData = { version: 1; artworks: Artwork[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDrawingOperation(value: unknown): value is DrawingOperation {
  return isRecord(value) && (value.type === 'stroke' || value.type === 'fill');
}

function normalizeOperations(operations: DrawingOperation[]): DrawingOperation[] {
  return operations.map((operation) => operation.type === 'stroke'
    ? { ...operation, stroke: { ...operation.stroke, opacity: typeof operation.stroke.opacity === 'number' ? operation.stroke.opacity : 1 } }
    : operation);
}

function normalizeDrawingState(value: unknown): DrawingState | null {
  if (!isRecord(value) || !isRecord(value.canvas)
    || typeof value.canvas.width !== 'number' || typeof value.canvas.height !== 'number'
    || value.canvas.width <= 0 || value.canvas.height <= 0) return null;

  if (Array.isArray(value.layers) && typeof value.activeLayerId === 'string') {
    if (!value.layers.every((layer) => isRecord(layer)
      && typeof layer.id === 'string'
      && typeof layer.name === 'string'
      && typeof layer.visible === 'boolean'
      && Array.isArray(layer.operations)
      && layer.operations.every(isDrawingOperation))) return null;
    const layers = (value.layers as DrawingState['layers']).map((layer) => ({ ...layer, operations: normalizeOperations(layer.operations) }));
    if (layers.length === 0 || !layers.some((layer) => layer.id === value.activeLayerId)) return null;
    return { canvas: value.canvas, layers, activeLayerId: value.activeLayerId } as DrawingState;
  }

  // Step 3/4 records were single-layer drawings. Keep them editable after the model change.
  if (Array.isArray(value.operations) && value.operations.every(isDrawingOperation)) {
    const layer = createLayer('layer-1', 'Layer 1');
    layer.operations = normalizeOperations(value.operations as DrawingOperation[]);
    return { canvas: value.canvas, layers: [layer], activeLayerId: layer.id } as DrawingState;
  }
  return null;
}

function normalizeArtwork(value: unknown): Artwork | null {
  if (!isRecord(value)) return null;
  const drawing = normalizeDrawingState(value.drawing);
  if (!drawing) return null;
  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
    ? { id: value.id, title: value.title, createdAt: value.createdAt, updatedAt: value.updatedAt, drawing }
    : null;
}

function normalizeStoredArtwork(value: unknown): Artwork {
  const artwork = normalizeArtwork(value);
  if (!artwork) throw new Error('One or more saved artworks are invalid.');
  return artwork;
}

function parseStoredData(raw: string | null): Artwork[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.artworks)) {
    throw new Error('Saved artwork data is not in a supported format.');
  }
  return parsed.artworks.map(normalizeStoredArtwork);
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  if (!FileSystem.documentDirectory) throw new Error('Local document storage is unavailable.');
  const uri = `${FileSystem.documentDirectory}${STORAGE_FILE}`;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? FileSystem.readAsStringAsync(uri) : null;
}

async function writeRaw(data: StoredData): Promise<void> {
  const raw = JSON.stringify(data);
  if (Platform.OS === 'web') {
    if (!globalThis.localStorage) throw new Error('Browser local storage is unavailable.');
    globalThis.localStorage.setItem(STORAGE_KEY, raw);
    return;
  }
  if (!FileSystem.documentDirectory) throw new Error('Local document storage is unavailable.');
  await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}${STORAGE_FILE}`, raw, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function listArtworks(): Promise<Artwork[]> {
  return parseStoredData(await readRaw());
}

export async function readArtwork(id: string): Promise<Artwork | null> {
  return (await listArtworks()).find((artwork) => artwork.id === id) ?? null;
}

export async function saveArtwork(artwork: Artwork): Promise<Artwork> {
  const artworks = await listArtworks();
  const index = artworks.findIndex((candidate) => candidate.id === artwork.id);
  const next = index < 0
    ? [...artworks, artwork]
    : artworks.map((candidate, candidateIndex) => candidateIndex === index ? artwork : candidate);
  await writeRaw({ version: 1, artworks: next });
  return artwork;
}

export async function deleteArtwork(id: string): Promise<void> {
  const artworks = await listArtworks();
  const next = artworks.filter((artwork) => artwork.id !== id);
  if (next.length === artworks.length) throw new Error('Artwork was not found.');
  await writeRaw({ version: 1, artworks: next });
}

export function createArtworkId(): string {
  return `artwork-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
