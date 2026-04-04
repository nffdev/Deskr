import 'package:socket_io_client/socket_io_client.dart' as sio;
import '../config.dart';

class SocketService {
  static SocketService? _instance;
  late sio.Socket socket;

  SocketService._() {
    socket = sio.io(AppConfig.socketUrl, <String, dynamic>{
      'transports': ['websocket', 'polling'],
      'autoConnect': true,
    });
  }

  static SocketService get instance {
    _instance ??= SocketService._();
    return _instance!;
  }

  void on(String event, Function(dynamic) callback) {
    socket.on(event, callback);
  }

  void off(String event, [Function(dynamic)? callback]) {
    socket.off(event, callback);
  }

  void dispose() {
    socket.disconnect();
    _instance = null;
  }
}
