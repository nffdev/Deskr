import 'dart:ui';

const double kDefaultRemoteWidth = 1920;
const double kDefaultRemoteHeight = 1080;

Offset? projectToRemoteScreen({
  required Size containerSize,
  required Offset localPosition,
  required Map<String, dynamic>? monitor,
}) {
  final screenW = (monitor?['width'] ?? kDefaultRemoteWidth).toDouble();
  final screenH = (monitor?['height'] ?? kDefaultRemoteHeight).toDouble();

  if (screenW <= 0 || screenH <= 0) return null;
  if (containerSize.width <= 0 || containerSize.height <= 0) return null;

  final imgAspect = screenW / screenH;
  final containerAspect = containerSize.width / containerSize.height;

  double imgX, imgY, imgW, imgH;
  if (containerAspect > imgAspect) {
    imgH = containerSize.height;
    imgW = imgH * imgAspect;
    imgX = (containerSize.width - imgW) / 2;
    imgY = 0;
  } else {
    imgW = containerSize.width;
    imgH = imgW / imgAspect;
    imgX = 0;
    imgY = (containerSize.height - imgH) / 2;
  }

  final relX = (localPosition.dx - imgX) / imgW;
  final relY = (localPosition.dy - imgY) / imgH;

  if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null;

  final x = relX * screenW;
  final y = relY * screenH;
  if (!x.isFinite || !y.isFinite) return null;

  return Offset(x, y);
}
