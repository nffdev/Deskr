import 'dart:convert';
import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/visual_keyboard.dart';
import 'remote_geometry.dart';

class FullscreenView extends StatefulWidget {
  final String? Function() currentDeviceId;
  final Map<String, dynamic>? Function() activeMonitor;
  final void Function(String key, String code) onSendKey;
  final ValueChanged<String> onFrame;
  final String? initialFrame;
  final bool initialMouseControl;
  final bool initialKeyboardControl;
  final VoidCallback onExit;

  const FullscreenView({
    super.key,
    required this.currentDeviceId,
    required this.activeMonitor,
    required this.onSendKey,
    required this.onFrame,
    required this.initialFrame,
    required this.initialMouseControl,
    required this.initialKeyboardControl,
    required this.onExit,
  });

  @override
  State<FullscreenView> createState() => _FullscreenViewState();
}

class _FullscreenViewState extends State<FullscreenView> {
  bool _mouseControl = false;
  bool _keyboardControl = false;
  String? _screenFrame;
  final GlobalKey _fsScreenKey = GlobalKey();
  DateTime? _lastMouseMove;

  @override
  void initState() {
    super.initState();
    _mouseControl = widget.initialMouseControl;
    _keyboardControl = widget.initialKeyboardControl;
    _screenFrame = widget.initialFrame;

    SocketService.instance.on('screenFrame', _onFrame);
  }

  void _onFrame(dynamic data) {
    final deviceId = widget.currentDeviceId();
    if (deviceId != null && data['connectionId'] == deviceId) {
      if (mounted) {
        setState(() => _screenFrame = data['frame']);
        widget.onFrame(data['frame']);
      }
    }
  }

  @override
  void dispose() {
    SocketService.instance.off('screenFrame', _onFrame);
    super.dispose();
  }

  Offset? _getRelativePosition(Offset globalPosition) {
    final renderBox = _fsScreenKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null || _screenFrame == null) return null;

    return projectToRemoteScreen(
      containerSize: renderBox.size,
      localPosition: renderBox.globalToLocal(globalPosition),
      monitor: widget.activeMonitor(),
    );
  }

  void _sendMouseEvent(String type, Offset globalPosition, {int button = 0}) {
    final deviceId = widget.currentDeviceId();
    if (!_mouseControl || deviceId == null) return;

    if (type == 'mouseMove') {
      final now = DateTime.now();
      if (_lastMouseMove != null && now.difference(_lastMouseMove!).inMilliseconds < 50) return;
      _lastMouseMove = now;
    }

    final pos = _getRelativePosition(globalPosition);
    if (pos == null) return;

    ApiService.sendCommand(deviceId, {
      'type': type,
      'x': pos.dx.round(),
      'y': pos.dy.round(),
      'button': button,
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) widget.onExit();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Column(
          children: [
            Expanded(
              child: Stack(
                children: [
                  GestureDetector(
                    onPanStart: (d) => _sendMouseEvent('mouseMove', d.globalPosition),
                    onPanUpdate: (d) => _sendMouseEvent('mouseMove', d.globalPosition),
                    onTapDown: (d) => _sendMouseEvent('mouseDown', d.globalPosition),
                    onTapUp: (d) => _sendMouseEvent('mouseUp', d.globalPosition),
                    onLongPressStart: (d) => _sendMouseEvent('mouseDown', d.globalPosition, button: 2),
                    onLongPressEnd: (d) => _sendMouseEvent('mouseUp', d.globalPosition, button: 2),
                    child: Container(
                      key: _fsScreenKey,
                      width: double.infinity,
                      height: double.infinity,
                      color: Colors.black,
                      child: _screenFrame != null
                          ? Image.memory(
                              base64Decode(_screenFrame!),
                              fit: BoxFit.contain,
                              gaplessPlayback: true,
                            )
                          : Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.monitor_rounded, size: 48, color: Colors.grey[800]),
                                  const SizedBox(height: 12),
                                  Text('Waiting for screen data...', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                                ],
                              ),
                            ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => setState(() => _mouseControl = !_mouseControl),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: _mouseControl ? AppColors.purple.withValues(alpha: 0.6) : Colors.black54,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.touch_app_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _keyboardControl = !_keyboardControl),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: _keyboardControl ? AppColors.purple.withValues(alpha: 0.6) : Colors.black54,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.keyboard_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                        GestureDetector(
                          onTap: widget.onExit,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.fullscreen_exit_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_mouseControl)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.purple.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('Touch Control', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                      ),
                    ),
                ],
              ),
            ),
            if (_keyboardControl)
              Container(
                color: AppColors.background,
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: VisualKeyboard(onKeyTap: widget.onSendKey),
              ),
          ],
        ),
      ),
    );
  }
}
