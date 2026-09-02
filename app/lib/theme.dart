import 'package:flutter/material.dart';

class AppColors {
  static const Color background = Color(0xFF030712);
  static const Color surface = Color(0xFF111827);
  static const Color surfaceLight = Color(0xFF1F2937);
  static const Color border = Color(0x15FFFFFF);
  static const Color borderLight = Color(0x20FFFFFF);
  static const Color purple = Color(0xFF9333EA);
  static const Color purpleLight = Color(0xFFA855F7);
  static const Color purpleDim = Color(0x33A855F7);
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color green = Color(0xFF22C55E);
  static const Color red = Color(0xFFEF4444);
}

class AppRadius {
  static const double sm = 10;
  static const double md = 14;
  static const double lg = 18;
  static const double xl = 22;
  static const double pill = 32;
}

class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
}

class AppMotion {
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration normal = Duration(milliseconds: 220);
  static const Duration slow = Duration(milliseconds: 320);
  static const Curve curve = Curves.easeOutCubic;
  static const double pressScale = 0.97;
}

class AppTypography {
  static const TextStyle largeTitle = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.4,
    height: 1.15,
  );

  static const TextStyle title = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.2,
    height: 1.2,
  );

  static const TextStyle subtitle = TextStyle(
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: -0.1,
    height: 1.3,
  );

  static const TextStyle body = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.4,
  );

  static const TextStyle caption = TextStyle(
    color: AppColors.textMuted,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.35,
  );

  static const TextStyle micro = TextStyle(
    color: AppColors.textMuted,
    fontSize: 11,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.2,
    height: 1.3,
  );
}

class AppTheme {
  static ThemeData get dark => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.background,
    fontFamily: 'SF Pro Display',
    colorScheme: const ColorScheme.dark(
      primary: AppColors.purple,
      secondary: AppColors.purpleLight,
      surface: AppColors.surface,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceLight.withValues(alpha: 0.5),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: const BorderSide(color: AppColors.purple, width: 1.5),
      ),
      hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14, letterSpacing: 0),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: AppColors.purpleLight,
      selectionColor: AppColors.purpleDim,
      selectionHandleColor: AppColors.purpleLight,
    ),
  );
}
