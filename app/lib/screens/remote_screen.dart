import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../widgets/glass_card.dart';
import '../widgets/visual_keyboard.dart';

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

    SocketService.instance.on('screenFrame', (data) {
      if (_selectedDevice != null && data['connectionId'] == _selectedDevice!['_id']) {
        if (mounted) {
          setState(() {
            _screenFrame = data['frame'];
            if (data['timestamp'] != null) {
              _latency = DateTime.now().millisecondsSinceEpoch - (data['timestamp'] as int);
            }
          });
        }
      }
    });

    SocketService.instance.on('monitors', (data) {
      if (_selectedDevice != null && data['connectionId'] == _selectedDevice!['_id']) {
        if (mounted) {
          setState(() {
            _monitors = List<Map<String, dynamic>>.from(data['monitors'] ?? []);
          });
        }
      }
    });

    SocketService.instance.on('connectionUpdated', (data) {
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
    });
  }

  Future<void> _fetchDevices() async {
    final devices = await ApiService.getConnections();
    if (mounted) setState(() => _devices = devices);
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
        pageBuilder: (_, __, ___) => _FullscreenView(
          parentState: this,
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
    _keyboardFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            bottom: -200,
            right: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.purple.withValues(alpha: 0.07),
              ),
            ),
          ),
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
                const Text('Remote Control', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
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
            GestureDetector(
              onTap: _disconnect,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
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
    final onlineDevices = _devices.where((d) => d['isActive'] == true).toList();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 8),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Select Device', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                if (onlineDevices.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Column(
                      children: [
                        Icon(Icons.cloud_off_rounded, color: AppColors.textMuted, size: 32),
                        SizedBox(height: 8),
                        Text('No devices online', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                        SizedBox(height: 2),
                        Text('Waiting for connections...', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  )
                else
                  ...onlineDevices.map((device) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: GestureDetector(
                      onTap: () => _connect(device),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceLight.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.monitor_rounded, color: AppColors.textSecondary, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    device['deviceInfo'] ?? 'Unknown',
                                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(device['ip'] ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                ],
                              ),
                            ),
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.green),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                          ],
                        ),
                      ),
                    ),
                  )),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.purpleDim,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(Icons.monitor_rounded, color: AppColors.purpleLight.withValues(alpha: 0.5), size: 36),
                ),
                const SizedBox(height: 12),
                const Text('Select a device to start', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                const SizedBox(height: 4),
                const Text('View the remote screen in real-time', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
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
                _ToolbarButton(
                  icon: Icons.fullscreen_rounded,
                  active: false,
                  onTap: _enterFullscreen,
                ),
                _ToolbarButton(
                  icon: Icons.touch_app_rounded,
                  active: _mouseControl,
                  onTap: () => setState(() => _mouseControl = !_mouseControl),
                ),
                _ToolbarButton(
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

class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  const _ToolbarButton({required this.icon, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        margin: const EdgeInsets.only(right: 4),
        decoration: BoxDecoration(
          color: active ? AppColors.purple.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: active ? AppColors.purpleLight : AppColors.textSecondary),
      ),
    );
  }
}

class _FullscreenView extends StatefulWidget {
  final _RemoteScreenState parentState;
  final VoidCallback onExit;

  const _FullscreenView({
    required this.parentState,
    required this.onExit,
  });

  @override
  State<_FullscreenView> createState() => _FullscreenViewState();
}

class _FullscreenViewState extends State<_FullscreenView> {
  bool _mouseControl = false;
  bool _keyboardControl = false;
  String? _screenFrame;
  final GlobalKey _fsScreenKey = GlobalKey();
  DateTime? _lastMouseMove;

  @override
  void initState() {
    super.initState();
    _mouseControl = widget.parentState._mouseControl;
    _keyboardControl = widget.parentState._keyboardControl;
    _screenFrame = widget.parentState._screenFrame;

    SocketService.instance.on('screenFrame', _onFrame);
  }

  void _onFrame(dynamic data) {
    final parent = widget.parentState;
    if (parent._selectedDevice != null && data['connectionId'] == parent._selectedDevice!['_id']) {
      if (mounted) {
        setState(() => _screenFrame = data['frame']);
        parent._screenFrame = data['frame'];
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

    final local = renderBox.globalToLocal(globalPosition);
    final size = renderBox.size;
    final parent = widget.parentState;

    final monitor = parent._monitors.isNotEmpty ? parent._monitors[parent._activeMonitor] : null;
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
    if (!_mouseControl || widget.parentState._selectedDevice == null) return;

    if (type == 'mouseMove') {
      final now = DateTime.now();
      if (_lastMouseMove != null && now.difference(_lastMouseMove!).inMilliseconds < 50) return;
      _lastMouseMove = now;
    }

    final pos = _getRelativePosition(globalPosition);
    if (pos == null) return;

    ApiService.sendCommand(widget.parentState._selectedDevice!['_id'], {
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
                child: VisualKeyboard(onKeyTap: widget.parentState._sendKey),
              ),
          ],
        ),
      ),
    );
  }
}
