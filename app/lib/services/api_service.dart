import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'auth_service.dart';

class ApiService {
  static Future<List<Map<String, dynamic>>> getConnections() async {
    try {
      final headers = await AuthService.authHeaders();
      print('[API] GET ${AppConfig.apiBase}/connections/recent');
      print('[API] Token: ${headers['Authorization']?.substring(0, 20)}...');
      final res = await http.get(
        Uri.parse('${AppConfig.apiBase}/connections/recent'),
        headers: headers,
      );
      print('[API] Status: ${res.statusCode} Body: ${res.body.substring(0, (res.body.length > 100 ? 100 : res.body.length))}');
      if (res.statusCode == 200) {
        return List<Map<String, dynamic>>.from(jsonDecode(res.body));
      }
      return [];
    } catch (e) {
      print('[API] Error: $e');
      return [];
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

  static Future<void> sendCommand(String deviceId, Map<String, dynamic> command) async {
    final headers = await AuthService.authHeaders();
    await http.post(
      Uri.parse('${AppConfig.apiBase}/connections/$deviceId/command'),
      headers: headers,
      body: jsonEncode(command),
    );
  }
}
