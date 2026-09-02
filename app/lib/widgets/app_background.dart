import 'package:flutter/material.dart';
import '../theme.dart';

class AppBackground extends StatelessWidget {
  const AppBackground({super.key});

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(gradient: AppGradients.background),
      child: SizedBox.expand(),
    );
  }
}
