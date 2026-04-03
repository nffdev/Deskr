import 'dart:async';
import 'package:flutter/material.dart';
import '../theme.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../widgets/glass_card.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  List<Map<String, dynamic>> _devices = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchDevices();

    SocketService.instance.on('newConnection', (_) => _fetchDevices());
    SocketService.instance.on('connectionUpdated', (_) => _fetchDevices());
  }

  Future<void> _fetchDevices() async {
    final devices = await ApiService.getConnections();
    if (mounted) {
      setState(() {
        _devices = devices;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final online = _devices.where((d) => d['isActive'] == true).toList();
    final offline = _devices.where((d) => d['isActive'] != true).toList();

    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -200,
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
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
                        child: const Icon(Icons.devices_rounded, color: AppColors.purpleLight, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Devices', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                          Text(
                            '${online.length} online',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: _fetchDevices,
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Icon(Icons.refresh_rounded, color: AppColors.textSecondary, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.purple))
                      : _devices.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 80,
                                    height: 80,
                                    decoration: BoxDecoration(
                                      color: AppColors.purpleDim,
                                      borderRadius: BorderRadius.circular(24),
                                    ),
                                    child: Icon(Icons.desktop_access_disabled_rounded, color: AppColors.purpleLight.withValues(alpha: 0.5), size: 40),
                                  ),
                                  const SizedBox(height: 16),
                                  const Text('No devices found', style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
                                  const SizedBox(height: 4),
                                  const Text('Build and run the client to connect', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              color: AppColors.purple,
                              backgroundColor: AppColors.surface,
                              onRefresh: _fetchDevices,
                              child: ListView(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                children: [
                                  if (online.isNotEmpty) ...[
                                    _SectionHeader(label: 'Online', count: online.length, color: AppColors.green),
                                    const SizedBox(height: 8),
                                    ...online.map((d) => _DeviceCard(device: d)),
                                    const SizedBox(height: 20),
                                  ],
                                  if (offline.isNotEmpty) ...[
                                    _SectionHeader(label: 'Offline', count: offline.length, color: AppColors.textMuted),
                                    const SizedBox(height: 8),
                                    ...offline.map((d) => _DeviceCard(device: d)),
                                  ],
                                ],
                              ),
                            ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _SectionHeader({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color),
          ),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 6),
          Text('$count', style: TextStyle(color: color.withValues(alpha: 0.6), fontSize: 12)),
        ],
      ),
    );
  }
}

class _DeviceCard extends StatelessWidget {
  final Map<String, dynamic> device;

  const _DeviceCard({required this.device});

  @override
  Widget build(BuildContext context) {
    final isActive = device['isActive'] == true;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        borderRadius: 14,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surfaceLight.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.monitor_rounded, color: AppColors.textSecondary, size: 20),
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
                  const SizedBox(height: 2),
                  Text(
                    device['ip'] ?? '',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isActive
                    ? AppColors.green.withValues(alpha: 0.1)
                    : AppColors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isActive ? AppColors.green : AppColors.red,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isActive ? 'Online' : 'Offline',
                    style: TextStyle(
                      color: isActive ? AppColors.green : AppColors.red,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
