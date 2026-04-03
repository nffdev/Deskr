class AppConfig {
  static const String baseApi = 'http://0.0.0.0:8080/api';
  static const int apiVersion = 1;
  static String get apiBase => '$baseApi/v$apiVersion';
  static String get socketUrl => baseApi.replaceAll('/api', '');
}
