import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'auth_service.dart';

class ApiService {
  static Future<List<Map<String, dynamic>>?> getConnections() async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.get(
        Uri.parse('${AppConfig.apiBase}/connections/recent'),
        headers: headers,
      );
      if (res.statusCode == 200) {
        return List<Map<String, dynamic>>.from(jsonDecode(res.body));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<Map<String, dynamic>>> getMonitors(String deviceId) async {
    final headers = await AuthService.authHeaders();
    final res = await http.get(
      Uri.parse('${AppConfig.apiBase}/connections/$deviceId/monitors'),
      headers: headers,
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return List<Map<String, dynamic>>.from(data['monitors'] ?? []);
    }
    return [];
  }

  static Future<Map<String, dynamic>?> getMe() async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.get(
        Uri.parse('${AppConfig.apiBase}/users/@me'),
        headers: headers,
      );
      if (res.statusCode == 200) {
        return Map<String, dynamic>.from(jsonDecode(res.body));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final headers = await AuthService.authHeaders();
      final res = await http.put(
        Uri.parse('${AppConfig.apiBase}/users/password'),
        headers: headers,
        body: jsonEncode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );

      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return {'success': true, 'message': data['message'] ?? 'Password changed successfully.'};
      }
      return {'success': false, 'message': data['message'] ?? 'Could not change password.'};
    } catch (e) {
      return {'success': false, 'message': 'Network error, please try again.'};
    }
  }

  static Future<bool> updateNotifications({
    bool? connectionAlerts,
    bool? buildNotifications,
  }) async {
    final body = <String, bool>{};
    if (connectionAlerts != null) body['connectionAlerts'] = connectionAlerts;
    if (buildNotifications != null) body['buildNotifications'] = buildNotifications;

    try {
      final headers = await AuthService.authHeaders();
      final res = await http.put(
        Uri.parse('${AppConfig.apiBase}/users/notifications'),
        headers: headers,
        body: jsonEncode(body),
      );
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<void> sendCommand(String deviceId, Map<String, dynamic> command) async {
    final headers = await AuthService.authHeaders();
    await http.post(
      Uri.parse('${AppConfig.apiBase}/connections/$deviceId/command'),
      headers: headers,
      body: jsonEncode(command),
    );
  }
}
