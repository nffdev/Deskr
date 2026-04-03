import 'package:flutter/material.dart';
import '../theme.dart';
import '../services/auth_service.dart';
import '../widgets/glass_card.dart';
import '../widgets/gradient_button.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String? _activeSection;
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _savingPassword = false;
  String? _passwordError;
  String? _passwordSuccess;
  bool _notifyConnections = true;
  bool _notifyBuilds = true;

  Future<void> _logout() async {
    await AuthService.clearToken();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -150,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
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
                      if (_activeSection != null)
                        GestureDetector(
                          onTap: () => setState(() {
                            _activeSection = null;
                            _passwordError = null;
                            _passwordSuccess = null;
                          }),
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: const Icon(Icons.arrow_back_rounded, color: AppColors.textSecondary, size: 20),
                          ),
                        )
                      else
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.purpleDim,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.settings_rounded, color: AppColors.purpleLight, size: 20),
                        ),
                      const SizedBox(width: 12),
                      Text(
                        _activeSection ?? 'Settings',
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: _activeSection == null
                      ? _buildMenu()
                      : _activeSection == 'Security'
                          ? _buildSecurity()
                          : _activeSection == 'Notifications'
                              ? _buildNotifications()
                              : const SizedBox(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenu() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        GlassCard(
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.purple, Color(0xFF7C3AED)]),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text('U', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('User', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                    SizedBox(height: 2),
                    Text('Free Tier', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.purpleDim,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('Free', style: TextStyle(color: AppColors.purpleLight, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _SettingsItem(
          icon: Icons.lock_outline_rounded,
          label: 'Security',
          subtitle: 'Change password',
          onTap: () => setState(() => _activeSection = 'Security'),
        ),
        _SettingsItem(
          icon: Icons.notifications_none_rounded,
          label: 'Notifications',
          subtitle: 'Alert preferences',
          onTap: () => setState(() => _activeSection = 'Notifications'),
        ),
        _SettingsItem(
          icon: Icons.storage_rounded,
          label: 'Storage',
          subtitle: '0 / 100 MB used',
          onTap: () {},
        ),
        _SettingsItem(
          icon: Icons.palette_outlined,
          label: 'Appearance',
          subtitle: 'Dark',
          onTap: () {},
        ),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: _logout,
          child: GlassCard(
            padding: const EdgeInsets.all(14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.logout_rounded, size: 18, color: AppColors.red.withValues(alpha: 0.8)),
                const SizedBox(width: 8),
                const Text('Log Out', style: TextStyle(color: AppColors.red, fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSecurity() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_passwordError != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.red.withValues(alpha: 0.2)),
                ),
                child: Text(_passwordError!, style: const TextStyle(color: AppColors.red, fontSize: 13)),
              ),
              const SizedBox(height: 16),
            ],
            if (_passwordSuccess != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.green.withValues(alpha: 0.2)),
                ),
                child: Text(_passwordSuccess!, style: const TextStyle(color: AppColors.green, fontSize: 13)),
              ),
              const SizedBox(height: 16),
            ],
            const Text('Current Password', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            TextField(
              controller: _currentPasswordController,
              obscureText: true,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: const InputDecoration(hintText: '••••••••'),
            ),
            const SizedBox(height: 16),
            const Text('New Password', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            TextField(
              controller: _newPasswordController,
              obscureText: true,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: const InputDecoration(hintText: '••••••••'),
            ),
            const SizedBox(height: 16),
            const Text('Confirm Password', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            TextField(
              controller: _confirmPasswordController,
              obscureText: true,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: const InputDecoration(hintText: '••••••••'),
            ),
            const SizedBox(height: 24),
            GradientButton(
              label: 'Save Password',
              loading: _savingPassword,
              onPressed: () {
                if (_newPasswordController.text != _confirmPasswordController.text) {
                  setState(() => _passwordError = 'Passwords do not match');
                  return;
                }
                if (_newPasswordController.text.length < 6) {
                  setState(() => _passwordError = 'Password must be at least 6 characters');
                  return;
                }
                setState(() => _passwordSuccess = 'Password updated successfully');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotifications() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GlassCard(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _ToggleItem(
              label: 'New Connections',
              subtitle: 'Get notified when a device connects',
              value: _notifyConnections,
              onChanged: (v) => setState(() => _notifyConnections = v),
            ),
            Divider(color: AppColors.border, height: 24),
            _ToggleItem(
              label: 'Build Completion',
              subtitle: 'Get notified when a build finishes',
              value: _notifyBuilds,
              onChanged: (v) => setState(() => _notifyBuilds = v),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsItem({required this.icon, required this.label, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: onTap,
        child: GlassCard(
          padding: const EdgeInsets.all(14),
          borderRadius: 14,
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppColors.textSecondary, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _ToggleItem extends StatelessWidget {
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleItem({required this.label, required this.subtitle, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeColor: AppColors.purpleLight,
          activeTrackColor: AppColors.purple.withValues(alpha: 0.4),
          inactiveTrackColor: AppColors.surfaceLight,
          inactiveThumbColor: AppColors.textMuted,
        ),
      ],
    );
  }
}
