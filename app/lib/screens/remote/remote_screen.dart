import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/pressable.dart';
import '../../widgets/visual_keyboard.dart';
import '../../widgets/device_selector.dart';
import '../../widgets/toolbar_button.dart';
import 'fullscreen_view.dart';
import '../../widgets/app_background.dart';

class RemoteScreen extends StatefulWidget {
  const RemoteScreen({super.key});

  @override
  State<RemoteScreen> createState() => _RemoteScreenState();
}

class _RemoteScreenState extends State<RemoteScreen> {
  List<Map<String, dynamic>> _devices = [];
  Map<String, dynamic>? _selectedDevice;
  bool _connected = false;
  bool _connecting = false;
  bool _mouseControl = false;
  bool _keyboardControl = false;
  final FocusNode _keyboardFocus = FocusNode();
  String? _screenFrame;
  int? _latency;
  List<Map<String, dynamic>> _monitors = [];
  int _activeMonitor = 0;
  final GlobalKey _screenKey = GlobalKey();
  DateTime? _lastMouseMove;

  @override
  void initState() {
    super.initState();
    _fetchDevices();

    SocketService.instance.on('screenFrame', _onScreenFrame);
    SocketService.instance.on('monitors', _onMonitors);
    SocketService.instance.on('connectionUpdated', _onConnectionUpdated);
  }

  void _onScreenFrame(dynamic data) {
    if (_selectedDevice != null && data['connectionId'] == _selectedDevice!['_id']) {
      if (mounted) {
        setState(() {
          _screenFrame = data['frame'];
          _latency = SocketService.instance.latency;
        });
      }
    }
  }

  void _onMonitors(dynamic data) {
    if (_selectedDevice != null && data['connectionId'] == _selectedDevice!['_id']) {
      if (mounted) {
        setState(() {
          _monitors = List<Map<String, dynamic>>.from(data['monitors'] ?? []);
        });
      }
    }
  }

  void _onConnectionUpdated(dynamic data) {
    _fetchDevices();
    if (_selectedDevice != null && data['_id'] == _selectedDevice!['_id'] && data['isActive'] != true) {
      if (mounted) {
        _exitFullscreen();
        setState(() {
          _connected = false;
          _connecting = false;
          _selectedDevice = null;
          _screenFrame = null;
          _latency = null;
          _monitors = [];
        });
      }
    }
  }

  Future<void> _fetchDevices() async {
    final devices = await ApiService.getConnections();
    if (mounted && devices != null) setState(() => _devices = devices);
  }

  Future<void> _connect(Map<String, dynamic> device) async {
    setState(() {
      _selectedDevice = device;
      _connecting = true;
      _screenFrame = null;
      _monitors = [];
      _activeMonitor = 0;
    });

    for (int i = 0; i < 15; i++) {
      final monitors = await ApiService.getMonitors(device['_id']);
      if (monitors.isNotEmpty) {
        if (mounted) setState(() => _monitors = monitors);
        break;
      }
      await Future.delayed(const Duration(seconds: 1));
    }

    if (mounted) {
      setState(() {
        _connecting = false;
        _connected = true;
      });
    }
  }

  Future<void> _switchMonitor(int index) async {
    setState(() {
      _activeMonitor = index;
      _screenFrame = null;
    });
    await ApiService.sendCommand(_selectedDevice!['_id'], {
      'type': 'switchMonitor',
      'monitorIndex': index,
    });
  }

  void _disconnect() {
    _exitFullscreen();
    setState(() {
      _connected = false;
      _selectedDevice = null;
      _screenFrame = null;
      _latency = null;
      _monitors = [];
      _activeMonitor = 0;
      _mouseControl = false;
    });
  }

  void _enterFullscreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: true,
        pageBuilder: (_, __, ___) => FullscreenView(
          currentDeviceId: () => _selectedDevice?['_id'] as String?,
          activeMonitor: () =>
              _monitors.isNotEmpty ? _monitors[_activeMonitor] : null,
          onSendKey: _sendKey,
          onFrame: (frame) => _screenFrame = frame,
          initialFrame: _screenFrame,
          initialMouseControl: _mouseControl,
          initialKeyboardControl: _keyboardControl,
          onExit: _exitFullscreen,
        ),
      ),
    );
  }

  void _exitFullscreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }

  Offset? _getRelativePosition(Offset globalPosition) {
    final renderBox = _screenKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null || _screenFrame == null) return null;

    final local = renderBox.globalToLocal(globalPosition);
    final size = renderBox.size;

    final monitor = _monitors.isNotEmpty ? _monitors[_activeMonitor] : null;
    final screenW = (monitor?['width'] ?? 1920).toDouble();
    final screenH = (monitor?['height'] ?? 1080).toDouble();

    final imgAspect = screenW / screenH;
    final containerAspect = size.width / size.height;

    double imgX, imgY, imgW, imgH;
    if (containerAspect > imgAspect) {
      imgH = size.height;
      imgW = imgH * imgAspect;
      imgX = (size.width - imgW) / 2;
      imgY = 0;
    } else {
      imgW = size.width;
      imgH = imgW / imgAspect;
      imgX = 0;
      imgY = (size.height - imgH) / 2;
    }

    final relX = (local.dx - imgX) / imgW;
    final relY = (local.dy - imgY) / imgH;

    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null;

    return Offset(relX * screenW, relY * screenH);
  }

  void _sendMouseEvent(String type, Offset globalPosition, {int button = 0}) {
    if (!_mouseControl || _selectedDevice == null) return;

    if (type == 'mouseMove') {
      final now = DateTime.now();
      if (_lastMouseMove != null && now.difference(_lastMouseMove!).inMilliseconds < 50) return;
      _lastMouseMove = now;
    }

    final pos = _getRelativePosition(globalPosition);
    if (pos == null) return;

    ApiService.sendCommand(_selectedDevice!['_id'], {
      'type': type,
      'x': pos.dx.round(),
      'y': pos.dy.round(),
      'button': button,
    });
  }

  void _sendKey(String key, String code) {
    if (!_connected || _selectedDevice == null) return;
    ApiService.sendCommand(_selectedDevice!['_id'], {'type': 'keyDown', 'key': key, 'code': code});
    Future.delayed(const Duration(milliseconds: 30), () {
      ApiService.sendCommand(_selectedDevice!['_id'], {'type': 'keyUp', 'key': key, 'code': code});
    });
  }

  @override
  void dispose() {
    SocketService.instance.off('screenFrame', _onScreenFrame);
    SocketService.instance.off('monitors', _onMonitors);
    SocketService.instance.off('connectionUpdated', _onConnectionUpdated);
    _keyboardFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: AppBackground()),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: !_connected && !_connecting
                      ? _buildDeviceSelector()
                      : _connecting
                          ? _buildConnecting()
                          : _buildRemoteView(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScreenArea() {
    return GestureDetector(
      onPanStart: (d) => _sendMouseEvent('mouseMove', d.globalPosition),
      onPanUpdate: (d) => _sendMouseEvent('mouseMove', d.globalPosition),
      onTapDown: (d) => _sendMouseEvent('mouseDown', d.globalPosition),
      onTapUp: (d) => _sendMouseEvent('mouseUp', d.globalPosition),
      onLongPressStart: (d) => _sendMouseEvent('mouseDown', d.globalPosition, button: 2),
      onLongPressEnd: (d) => _sendMouseEvent('mouseUp', d.globalPosition, button: 2),
      child: Container(
        key: _screenKey,
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
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.purpleDim,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.radio_rounded, color: AppColors.purpleLight, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Remote Control', style: AppTypography.title),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        _connected ? 'Connected to ${_selectedDevice?['deviceInfo']}' : 'No active session',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (_connected) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(width: 4, height: 4, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.green)),
                            const SizedBox(width: 4),
                            const Text('Live', style: TextStyle(color: AppColors.green, fontSize: 9, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (_connected)
            Pressable(
              onTap: _disconnect,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  border: Border.all(color: AppColors.red.withValues(alpha: 0.2)),
                ),
                child: const Text('Disconnect', style: TextStyle(color: AppColors.red, fontSize: 12, fontWeight: FontWeight.w500)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDeviceSelector() {
    return DeviceSelector(
      devices: _devices,
      onSelect: _connect,
      placeholderIcon: Icons.monitor_rounded,
      placeholderSubtitle: 'View the remote screen in real-time',
    );
  }

  Widget _buildConnecting() {
    return Center(
      child: GlassCard(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 64,
              height: 64,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 64,
                    height: 64,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.purple.withValues(alpha: 0.3),
                    ),
                  ),
                  const Icon(Icons.wifi_rounded, color: AppColors.purpleLight, size: 28),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Connecting...', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              'Establishing connection to ${_selectedDevice?['deviceInfo']}',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRemoteView() {
    return Column(
      children: [
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            borderRadius: 12,
            child: Row(
              children: [
                ToolbarButton(
                  icon: Icons.fullscreen_rounded,
                  active: false,
                  onTap: _enterFullscreen,
                ),
                ToolbarButton(
                  icon: Icons.touch_app_rounded,
                  active: _mouseControl,
                  onTap: () => setState(() => _mouseControl = !_mouseControl),
                ),
                ToolbarButton(
                  icon: Icons.keyboard_rounded,
                  active: _keyboardControl,
                  onTap: () {
                    setState(() => _keyboardControl = !_keyboardControl);
                    if (_keyboardControl) {
                      _keyboardFocus.requestFocus();
                    }
                  },
                ),
                if (_monitors.length > 1)
                  PopupMenuButton<int>(
                    onSelected: _switchMonitor,
                    color: AppColors.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppColors.border),
                    ),
                    offset: const Offset(0, 40),
                    itemBuilder: (_) => _monitors.map((m) {
                      final idx = m['index'] as int;
                      return PopupMenuItem(
                        value: idx,
                        child: Row(
                          children: [
                            Icon(Icons.monitor_rounded, size: 14, color: _activeMonitor == idx ? AppColors.purpleLight : AppColors.textSecondary),
                            const SizedBox(width: 8),
                            Text(
                              'Screen ${idx + 1}${m['isPrimary'] == true ? ' (Primary)' : ''}',
                              style: TextStyle(color: _activeMonitor == idx ? AppColors.purpleLight : Colors.white, fontSize: 12),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.screenshot_monitor_rounded, size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 6),
                          Text('Screen ${_activeMonitor + 1}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                          const SizedBox(width: 4),
                          const Icon(Icons.expand_more_rounded, size: 14, color: AppColors.textSecondary),
                        ],
                      ),
                    ),
                  ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _screenFrame != null ? AppColors.green : Colors.amber,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _latency != null ? '${_latency}ms' : '—',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                if (_monitors.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${_monitors[_activeMonitor]['width']}x${_monitors[_activeMonitor]['height']}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _buildScreenArea(),
            ),
          ),
        ),
        if (_keyboardControl) ...[
          const SizedBox(height: 8),
          VisualKeyboard(onKeyTap: _sendKey),
        ],
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: GlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            borderRadius: 12,
            child: Row(
              children: [
                const Icon(Icons.monitor_rounded, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _selectedDevice?['deviceInfo'] ?? '',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Icon(Icons.wifi_rounded, size: 14, color: AppColors.green),
                const SizedBox(width: 6),
                Text(
                  _selectedDevice?['ip'] ?? '',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
