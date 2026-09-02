import 'package:flutter_test/flutter_test.dart';
import 'package:socket_io_common/src/util/event_emitter.dart';

class _Screen {
  final String name;
  final List<String> received;
  _Screen(this.name, this.received);

  void onConnectionUpdated(dynamic _) => received.add(name);
}

void main() {
  test('off(event, tearOff) actually removes the handler', () {
    final emitter = EventEmitter();
    final received = <String>[];
    final screen = _Screen('a', received);

    emitter.on('connectionUpdated', screen.onConnectionUpdated);
    emitter.emit('connectionUpdated', null);
    expect(received.length, 1);

    emitter.off('connectionUpdated', screen.onConnectionUpdated);
    emitter.emit('connectionUpdated', null);
    expect(received.length, 1, reason: 'the handler should have been removed');
  });

  test('revisiting a tab does not accumulate handlers', () {
    final emitter = EventEmitter();
    final received = <String>[];

    for (var i = 0; i < 10; i++) {
      final screen = _Screen('visit$i', received);
      emitter.on('connectionUpdated', screen.onConnectionUpdated);
      emitter.off('connectionUpdated', screen.onConnectionUpdated);
    }

    final screen = _Screen('active', received);
    emitter.on('connectionUpdated', screen.onConnectionUpdated);
    emitter.emit('connectionUpdated', null);

    expect(received, ['active'],
        reason: 'only the live screen should react, not the 10 disposed ones');
  });

  test('a targeted off does not unsubscribe other screens', () {
    final emitter = EventEmitter();
    final received = <String>[];
    final devices = _Screen('devices', received);
    final remote = _Screen('remote', received);
    final shell = _Screen('shell', received);

    emitter.on('connectionUpdated', devices.onConnectionUpdated);
    emitter.on('connectionUpdated', remote.onConnectionUpdated);
    emitter.on('connectionUpdated', shell.onConnectionUpdated);

    emitter.off('connectionUpdated', remote.onConnectionUpdated);
    emitter.emit('connectionUpdated', null);

    expect(received, ['devices', 'shell']);
  });
}
