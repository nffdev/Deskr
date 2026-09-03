import 'package:flutter/material.dart';
import '../theme.dart';
import 'glass_card.dart';
import 'pressable.dart';

class DeviceSelector extends StatelessWidget {
  final List<Map<String, dynamic>> devices;
  final ValueChanged<Map<String, dynamic>> onSelect;
  final IconData placeholderIcon;
  final String placeholderSubtitle;

  const DeviceSelector({
    super.key,
    required this.devices,
    required this.onSelect,
    required this.placeholderIcon,
    required this.placeholderSubtitle,
  });

  @override
  Widget build(BuildContext context) {
    final onlineDevices = devices.where((d) => d['isActive'] == true).toList();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 8),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
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
                    child: Pressable(
                      onTap: () => onSelect(device),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(AppRadius.md),
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
                  child: Icon(placeholderIcon, color: AppColors.purpleLight.withValues(alpha: 0.5), size: 36),
                ),
                const SizedBox(height: 12),
                const Text('Select a device to start', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                const SizedBox(height: 4),
                Text(placeholderSubtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
