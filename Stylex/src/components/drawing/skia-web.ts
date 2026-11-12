export async function loadSkiaWeb() {
  const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
  return LoadSkiaWeb();
}
