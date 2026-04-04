import 'package:socket_io_client/socket_io_client.dart' as sio;
import '../config.dart';

class SocketService {
  static SocketService? _instance;
  late sio.Socket socket;

  int _pingStart = 0;
  int latency = 0;

  SocketService._() {
    socket = sio.io(AppConfig.socketUrl, <String, dynamic>{
      'transports': ['websocket', 'polling'],
      'autoConnect': true,
    });

    socket.on('ping', (_) {
      _pingStart = DateTime.now().millisecondsSinceEpoch;
    });

    socket.on('pong', (_) {
      if (_pingStart > 0) {
        latency = DateTime.now().millisecondsSinceEpoch - _pingStart;
      }
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
