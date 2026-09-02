import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart' show CupertinoPageRoute;
import '../theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/push_service.dart';
import '../widgets/glass_card.dart';
import '../widgets/gradient_button.dart';
import '../widgets/pressable.dart';
import '../widgets/app_background.dart';
import 'login_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    final navigator = Navigator.of(context);
    await PushService.unregister();
    await AuthService.clearToken();
    navigator.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  void _open(BuildContext context, Widget page) {
    Navigator.of(context).push(CupertinoPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: AppBackground()),
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
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: const Icon(Icons.settings_rounded, color: AppColors.purpleLight, size: 20),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      const Text('Settings', style: AppTypography.title),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Expanded(child: _buildMenu(context)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenu(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      children: [
        GlassCard(
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.purpleLight, AppColors.purpleDeep],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
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
          onTap: () => _open(context, const SecurityScreen()),
        ),
        _SettingsItem(
          icon: Icons.notifications_none_rounded,
          label: 'Notifications',
          subtitle: 'Alert preferences',
          onTap: () => _open(context, const NotificationsScreen()),
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
        const SizedBox(height: AppSpacing.xl),
        Pressable(
          onTap: () => _logout(context),
          child: Container(
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.red,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.logout_rounded, size: 18, color: Colors.white),
                SizedBox(width: 8),
                Text(
                  'Log Out',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.41,
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

class _SectionPage extends StatelessWidget {
  final String title;
  final Widget child;

  const _SectionPage({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: AppBackground()),
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Row(
                    children: [
                      Pressable(
                        onTap: () => Navigator.of(context).pop(),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Icon(Icons.arrow_back_rounded, color: AppColors.textSecondary, size: 20),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Text(title, style: AppTypography.title),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _savingPassword = false;
  String? _passwordError;
  String? _passwordSuccess;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    setState(() {
      _passwordError = null;
      _passwordSuccess = null;
    });

    if (_currentPasswordController.text.isEmpty) {
      setState(() => _passwordError = 'Please enter your current password');
      return;
    }
    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() => _passwordError = 'Passwords do not match');
      return;
    }
    if (_newPasswordController.text.length < 6) {
      setState(() => _passwordError = 'Password must be at least 6 characters');
      return;
    }

    setState(() => _savingPassword = true);

    final result = await ApiService.changePassword(
      currentPassword: _currentPasswordController.text,
      newPassword: _newPasswordController.text,
    );

    if (!mounted) return;

    setState(() {
      _savingPassword = false;
      if (result['success'] == true) {
        _passwordSuccess = result['message'];
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
      } else {
        _passwordError = result['message'];
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return _SectionPage(
      title: 'Security',
      child: Padding(
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
                onPressed: _savingPassword ? null : _changePassword,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _notifyConnections = true;
  bool _notifyBuilds = true;
  bool _loadingPrefs = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final me = await ApiService.getMe();
    if (!mounted) return;

    final notifications = me?['notifications'];
    setState(() {
      if (notifications is Map) {
        _notifyConnections = notifications['connectionAlerts'] != false;
        _notifyBuilds = notifications['buildNotifications'] != false;
      }
      _loadingPrefs = false;
    });
  }

  Future<void> _setNotifyConnections(bool value) async {
    final previous = _notifyConnections;
    setState(() => _notifyConnections = value);

    final ok = await ApiService.updateNotifications(connectionAlerts: value);
    if (!ok && mounted) {
      setState(() => _notifyConnections = previous);
      _showSaveError();
    }
  }

  Future<void> _setNotifyBuilds(bool value) async {
    final previous = _notifyBuilds;
    setState(() => _notifyBuilds = value);

    final ok = await ApiService.updateNotifications(buildNotifications: value);
    if (!ok && mounted) {
      setState(() => _notifyBuilds = previous);
      _showSaveError();
    }
  }

  void _showSaveError() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Could not save your preference'),
        backgroundColor: AppColors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _SectionPage(
      title: 'Notifications',
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: GlassCard(
          child: _loadingPrefs
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: CircularProgressIndicator(color: AppColors.purple),
                  ),
                )
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _ToggleItem(
                      label: 'New Connections',
                      subtitle: 'Get notified when a device connects',
                      value: _notifyConnections,
                      onChanged: _setNotifyConnections,
                    ),
                    Divider(color: AppColors.border, height: 24),
                    _ToggleItem(
                      label: 'Build Completion',
                      subtitle: 'Get notified when a build finishes',
                      value: _notifyBuilds,
                      onChanged: _setNotifyBuilds,
                    ),
                  ],
                ),
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
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        borderRadius: AppRadius.md,
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.surfaceLight.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Icon(icon, color: AppColors.textSecondary, size: 18),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: -0.1)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: AppTypography.caption),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
          ],
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
