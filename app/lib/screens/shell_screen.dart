import 'package:flutter/material.dart';
import '../theme.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../widgets/glass_card.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  List<Map<String, dynamic>> _devices = [];
  Map<String, dynamic>? _selectedDevice;
  final List<_ShellEntry> _history = [];
  final List<String> _cmdHistory = [];
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _fetchDevices();

    SocketService.instance.on('shellOutput', _onShellOutput);
    SocketService.instance.on('connectionUpdated', (_) => _fetchDevices());
  }

  void _onShellOutput(dynamic data) {
    if (_selectedDevice != null && data['connectionId'] == _selectedDevice!['_id']) {
      if (mounted) {
        setState(() {
          _history.add(_ShellEntry(type: 'output', text: data['output'] ?? ''));
        });
        _scrollToBottom();
      }
    }
  }

  Future<void> _fetchDevices() async {
    final devices = await ApiService.getConnections();
    if (mounted) setState(() => _devices = devices);
  }

  void _connect(Map<String, dynamic> device) {
    setState(() {
      _selectedDevice = device;
      _history.clear();
      _history.add(_ShellEntry(type: 'system', text: 'Connected to ${device['deviceInfo']} (${device['ip']})'));
    });
  }

  void _disconnect() {
    setState(() {
      _selectedDevice = null;
      _history.clear();
    });
  }

  void _sendCommand() {
    final cmd = _controller.text.trim();
    if (cmd.isEmpty || _selectedDevice == null) return;

    final commandId = DateTime.now().millisecondsSinceEpoch.toString();

    setState(() {
      _history.add(_ShellEntry(type: 'command', text: cmd));
      _cmdHistory.insert(0, cmd);
    });

    ApiService.sendCommand(_selectedDevice!['_id'], {
      'type': 'shell',
      'command': cmd,
      'commandId': commandId,
    });

    _controller.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 50), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 100),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    SocketService.instance.off('shellOutput', _onShellOutput);
    _controller.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            bottom: -200,
            left: -100,
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
                  child: _selectedDevice == null
                      ? _buildDeviceSelector()
                      : _buildTerminal(),
                ),
              ],
            ),
          ),
        ],
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
            child: const Icon(Icons.terminal_rounded, color: AppColors.purpleLight, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Shell', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                Text(
                  _selectedDevice != null
                      ? 'Connected to ${_selectedDevice!['deviceInfo']}'
                      : 'Select a device',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (_selectedDevice != null) ...[
            GestureDetector(
              onTap: () => setState(() => _history.clear()),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.delete_outline_rounded, color: AppColors.textMuted, size: 18),
              ),
            ),
            const SizedBox(width: 8),
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
        ],
      ),
    );
  }

  Widget _buildDeviceSelector() {
    final onlineDevices = _devices.where((d) => d['isActive'] == true).toList();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Online Devices', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
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
                        Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.green)),
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
    );
  }

  Widget _buildTerminal() {
    return Column(
      children: [
        const SizedBox(height: 12),
        Expanded(
          child: GestureDetector(
            onTap: () => _focusNode.requestFocus(),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0a0a0f),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: ListView.builder(
                controller: _scrollController,
                itemCount: _history.length,
                itemBuilder: (context, index) {
                  final entry = _history[index];
                  switch (entry.type) {
                    case 'command':
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('> ', style: TextStyle(color: AppColors.purpleLight, fontFamily: 'monospace', fontSize: 13)),
                            Expanded(child: Text(entry.text, style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 13))),
                          ],
                        ),
                      );
                    case 'output':
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4, left: 16),
                        child: Text(entry.text, style: TextStyle(color: Colors.grey[400], fontFamily: 'monospace', fontSize: 12)),
                      );
                    case 'error':
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4, left: 16),
                        child: Text(entry.text, style: const TextStyle(color: AppColors.red, fontFamily: 'monospace', fontSize: 12)),
                      );
                    case 'system':
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(entry.text, style: TextStyle(color: Colors.grey[600], fontFamily: 'monospace', fontSize: 11)),
                      );
                    default:
                      return const SizedBox.shrink();
                  }
                },
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Padding(
                  padding: EdgeInsets.only(left: 12),
                  child: Text('>', style: TextStyle(color: AppColors.purpleLight, fontFamily: 'monospace', fontSize: 14, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    onSubmitted: (_) => _sendCommand(),
                    style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 13),
                    decoration: const InputDecoration(
                      hintText: 'Type a command...',
                      hintStyle: TextStyle(color: AppColors.textMuted, fontFamily: 'monospace', fontSize: 13),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: _sendCommand,
                  child: Container(
                    margin: const EdgeInsets.all(6),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.purple.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.send_rounded, color: AppColors.purpleLight, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ShellEntry {
  final String type;
  final String text;

  _ShellEntry({required this.type, required this.text});
}
