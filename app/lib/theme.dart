import 'package:flutter/material.dart';

class AppColors {
  static const Color background = Color(0xFF000000);
  static const Color backgroundElevated = Color(0xFF14101C);
  static const Color surface = Color(0xFF1C1C1E);
  static const Color surfaceLight = Color(0xFF2C2C2E);

  static const Color border = Color(0x1FFFFFFF);
  static const Color borderLight = Color(0x33FFFFFF);

  static const Color purple = Color(0xFFAF52DE);
  static const Color purpleLight = Color(0xFFBF5AF2);
  static const Color purpleDeep = Color(0xFF8E4EC6);
  static const Color purpleDim = Color(0x33BF5AF2);

  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0x99EBEBF5);
  static const Color textMuted = Color(0x4DEBEBF5);

  static const Color green = Color(0xFF30D158);
  static const Color red = Color(0xFFFF453A);
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
    fontSize: 34,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.37,
    height: 41 / 34,
  );

  static const TextStyle title = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 22,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.35,
    height: 28 / 22,
  );

  static const TextStyle subtitle = TextStyle(
    color: AppColors.textSecondary,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.24,
    height: 20 / 15,
  );

  static const TextStyle body = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.41,
    height: 22 / 17,
  );

  static const TextStyle headline = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.41,
    height: 22 / 17,
  );

  static const TextStyle caption = TextStyle(
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.08,
    height: 18 / 13,
  );

  static const TextStyle micro = TextStyle(
    color: AppColors.textMuted,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.07,
    height: 13 / 11,
  );
}

class AppGradients {
  static const LinearGradient background = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      AppColors.backgroundElevated,
      Color(0xFF08060D),
      AppColors.background,
    ],
    stops: [0.0, 0.45, 1.0],
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
      fillColor: AppColors.surfaceLight.withValues(alpha: 0.6),
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
        borderSide: const BorderSide(color: AppColors.purpleLight, width: 1.5),
      ),
      hintStyle: const TextStyle(
        color: AppColors.textMuted,
        fontSize: 17,
        letterSpacing: -0.41,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: AppColors.purpleLight,
      selectionColor: AppColors.purpleDim,
      selectionHandleColor: AppColors.purpleLight,
    ),
  );
}
