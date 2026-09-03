import 'dart:ui';

import 'package:deskr/screens/remote/remote_geometry.dart';
import 'package:flutter_test/flutter_test.dart';

const hd = {'width': 1920, 'height': 1080};

void main() {
  group('exact fit (same aspect ratio)', () {
    const size = Size(960, 540);

    test('center maps to the center of the remote screen', () {
      final pos = projectToRemoteScreen(
        containerSize: size,
        localPosition: const Offset(480, 270),
        monitor: hd,
      );
      expect(pos, isNotNull);
      expect(pos!.dx, closeTo(960, 0.01));
      expect(pos.dy, closeTo(540, 0.01));
    });

    test('corners map to the corners', () {
      final topLeft = projectToRemoteScreen(
        containerSize: size,
        localPosition: Offset.zero,
        monitor: hd,
      );
      expect(topLeft, const Offset(0, 0));

      final bottomRight = projectToRemoteScreen(
        containerSize: size,
        localPosition: const Offset(960, 540),
        monitor: hd,
      );
      expect(bottomRight!.dx, closeTo(1920, 0.01));
      expect(bottomRight.dy, closeTo(1080, 0.01));
    });

    test('a point outside the container returns null', () {
      expect(
        projectToRemoteScreen(
          containerSize: size,
          localPosition: const Offset(-1, 100),
          monitor: hd,
        ),
        isNull,
      );
    });
  });

  group('pillarbox (container wider than the remote screen)', () {
    const size = Size(1000, 540);

    test('the side bands map to nothing', () {
      expect(
        projectToRemoteScreen(
          containerSize: size,
          localPosition: const Offset(10, 270),
          monitor: hd,
        ),
        isNull,
        reason: 'left band',
      );
      expect(
        projectToRemoteScreen(
          containerSize: size,
          localPosition: const Offset(990, 270),
          monitor: hd,
        ),
        isNull,
        reason: 'right band',
      );
    });

    test('the image area is offset by the band width', () {
      final pos = projectToRemoteScreen(
        containerSize: size,
        localPosition: const Offset(20, 0),
        monitor: hd,
      );
      expect(pos, isNotNull);
      expect(pos!.dx, closeTo(0, 0.01),
          reason: 'the left edge of the image is x=20 in the container');
    });
  });

  group('letterbox (container taller than the remote screen)', () {
    const size = Size(960, 600);

    test('the top and bottom bands map to nothing', () {
      expect(
        projectToRemoteScreen(
          containerSize: size,
          localPosition: const Offset(480, 10),
          monitor: hd,
        ),
        isNull,
        reason: 'top band',
      );
      expect(
        projectToRemoteScreen(
          containerSize: size,
          localPosition: const Offset(480, 590),
          monitor: hd,
        ),
        isNull,
        reason: 'bottom band',
      );
    });

    test('the image area is offset by the band height', () {
      final pos = projectToRemoteScreen(
        containerSize: size,
        localPosition: const Offset(0, 30),
        monitor: hd,
      );
      expect(pos, isNotNull);
      expect(pos!.dy, closeTo(0, 0.01));
    });
  });

  group('fallbacks and degenerate input', () {
    test('a null monitor falls back to 1920x1080', () {
      final pos = projectToRemoteScreen(
        containerSize: const Size(960, 540),
        localPosition: const Offset(960, 540),
        monitor: null,
      );
      expect(pos!.dx, closeTo(kDefaultRemoteWidth, 0.01));
      expect(pos.dy, closeTo(kDefaultRemoteHeight, 0.01));
    });

    test('a zero-height container returns null instead of NaN', () {
      expect(
        projectToRemoteScreen(
          containerSize: const Size(960, 0),
          localPosition: const Offset(480, 0),
          monitor: hd,
        ),
        isNull,
      );
    });

    test('a zero-sized monitor returns null', () {
      expect(
        projectToRemoteScreen(
          containerSize: const Size(960, 540),
          localPosition: const Offset(10, 10),
          monitor: const {'width': 0, 'height': 0},
        ),
        isNull,
      );
    });
  });
}
