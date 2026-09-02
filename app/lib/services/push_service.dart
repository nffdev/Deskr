import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'auth_service.dart';

class PushService {
  static const _channel = MethodChannel('deskr/push');
  static String? _lastToken;
  static bool _wired = false;

  static void init() {
    if (_wired) return;
    _wired = true;

    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onToken') {
        _lastToken = call.arguments as String?;
        await _syncToken();
      }
      return null;
    });
  }

  static Future<bool> requestPermission() async {
    try {
      final granted = await _channel.invokeMethod<bool>('requestPermission');
      return granted ?? false;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  static Future<void> syncExistingToken() => _syncToken();

  static Future<void> _syncToken() async {
    final token = _lastToken;
    if (token == null || token.isEmpty) return;
    if (!await AuthService.isLoggedIn()) return;

    try {
      final headers = await AuthService.authHeaders();
      await http.post(
        Uri.parse('${AppConfig.apiBase}/users/device-token'),
        headers: headers,
        body: jsonEncode({'token': token, 'platform': 'ios'}),
      );
    } catch (_) { }
  }

  static Future<void> unregister() async {
    final token = _lastToken;
    if (token == null || token.isEmpty) return;

    try {
      final headers = await AuthService.authHeaders();
      await http.delete(
        Uri.parse('${AppConfig.apiBase}/users/device-token'),
        headers: headers,
        body: jsonEncode({'token': token}),
      );
    } catch (_) { }
  }
}
