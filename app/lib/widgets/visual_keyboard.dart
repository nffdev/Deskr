import 'package:flutter/material.dart';
import '../theme.dart';

class VisualKeyboard extends StatelessWidget {
  final void Function(String key, String code) onKeyTap;

  const VisualKeyboard({super.key, required this.onKeyTap});

  static const _rows = [
    [
      {'label': 'Esc', 'code': 'Escape'},
      {'label': '1', 'code': 'Digit1'}, {'label': '2', 'code': 'Digit2'},
      {'label': '3', 'code': 'Digit3'}, {'label': '4', 'code': 'Digit4'},
      {'label': '5', 'code': 'Digit5'}, {'label': '6', 'code': 'Digit6'},
      {'label': '7', 'code': 'Digit7'}, {'label': '8', 'code': 'Digit8'},
      {'label': '9', 'code': 'Digit9'}, {'label': '0', 'code': 'Digit0'},
      {'label': '⌫', 'code': 'Backspace'},
    ],
    [
      {'label': 'Tab', 'code': 'Tab'},
      {'label': 'Q', 'code': 'KeyQ'}, {'label': 'W', 'code': 'KeyW'},
      {'label': 'E', 'code': 'KeyE'}, {'label': 'R', 'code': 'KeyR'},
      {'label': 'T', 'code': 'KeyT'}, {'label': 'Y', 'code': 'KeyY'},
      {'label': 'U', 'code': 'KeyU'}, {'label': 'I', 'code': 'KeyI'},
      {'label': 'O', 'code': 'KeyO'}, {'label': 'P', 'code': 'KeyP'},
    ],
    [
      {'label': 'Caps', 'code': 'CapsLock'},
      {'label': 'A', 'code': 'KeyA'}, {'label': 'S', 'code': 'KeyS'},
      {'label': 'D', 'code': 'KeyD'}, {'label': 'F', 'code': 'KeyF'},
      {'label': 'G', 'code': 'KeyG'}, {'label': 'H', 'code': 'KeyH'},
      {'label': 'J', 'code': 'KeyJ'}, {'label': 'K', 'code': 'KeyK'},
      {'label': 'L', 'code': 'KeyL'}, {'label': '↵', 'code': 'Enter'},
    ],
    [
      {'label': '⇧', 'code': 'ShiftLeft'},
      {'label': 'Z', 'code': 'KeyZ'}, {'label': 'X', 'code': 'KeyX'},
      {'label': 'C', 'code': 'KeyC'}, {'label': 'V', 'code': 'KeyV'},
      {'label': 'B', 'code': 'KeyB'}, {'label': 'N', 'code': 'KeyN'},
      {'label': 'M', 'code': 'KeyM'},
      {'label': ',', 'code': 'Comma'}, {'label': '.', 'code': 'Period'},
      {'label': '/', 'code': 'Slash'},
    ],
    [
      {'label': 'Ctrl', 'code': 'ControlLeft'},
      {'label': 'Win', 'code': 'MetaLeft'},
      {'label': 'Alt', 'code': 'AltLeft'},
      {'label': 'Space', 'code': 'Space'},
      {'label': 'Alt', 'code': 'AltRight'},
      {'label': '←', 'code': 'ArrowLeft'},
      {'label': '↑', 'code': 'ArrowUp'},
      {'label': '↓', 'code': 'ArrowDown'},
      {'label': '→', 'code': 'ArrowRight'},
    ],
  ];

  static const _wideCodes = ['Space', 'Escape', 'Backspace', 'Tab', 'CapsLock', 'Enter', 'ShiftLeft', 'ControlLeft'];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: _rows.map((row) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: row.map((k) {
                final label = k['label']!;
                final code = k['code']!;
                final isWide = _wideCodes.contains(code);
                final key = code.startsWith('Key') ? code.substring(3).toLowerCase() : label;

                return Expanded(
                  flex: code == 'Space' ? 4 : (isWide ? 2 : 1),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 1.5),
                    child: GestureDetector(
                      onTap: () => onKeyTap(key, code),
                      child: Container(
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Center(
                          child: Text(
                            label,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          );
        }).toList(),
      ),
    );
  }
}
