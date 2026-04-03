import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = AppConfig.tokenKey;

  static Future<String?> getToken() => _storage.read(key: _tokenKey);

  static Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  static Future<void> clearToken() => _storage.delete(key: _tokenKey);

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('${AppConfig.apiBase}/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(res.body);
    if (res.statusCode == 200 && data['token'] != null) {
      await saveToken(data['token']);
      return {'success': true};
    }
    return {'success': false, 'message': data['message'] ?? 'Login failed'};
  }

  static Future<Map<String, dynamic>> register(String username, String email, String password) async {
    final res = await http.post(
      Uri.parse('${AppConfig.apiBase}/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'email': email, 'password': password}),
    );

    final data = jsonDecode(res.body);
    if (res.statusCode == 201 && data['token'] != null) {
      await saveToken(data['token']);
      return {'success': true};
    }
    return {'success': false, 'message': data['message'] ?? 'Registration failed'};
  }

  static Future<Map<String, String>> authHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
}
