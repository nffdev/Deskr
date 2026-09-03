import 'package:flutter/material.dart';
import '../theme.dart';
import 'pressable.dart';

class ToolbarButton extends StatelessWidget {
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  const ToolbarButton({super.key, required this.icon, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppMotion.normal,
        curve: AppMotion.curve,
        padding: const EdgeInsets.all(8),
        margin: const EdgeInsets.only(right: 4),
        decoration: BoxDecoration(
          color: active ? AppColors.purple.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: Icon(icon, size: 18, color: active ? AppColors.purpleLight : AppColors.textSecondary),
      ),
    );
  }
}
