package com.kovacevic.familio.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.kovacevic.familio.data.local.ThemeMode

data class FamilioExtendedColors(
    val success: androidx.compose.ui.graphics.Color,
    val warning: androidx.compose.ui.graphics.Color,
    val textMuted: androidx.compose.ui.graphics.Color,
    val surfaceAlt: androidx.compose.ui.graphics.Color,
)

private val LightExtendedColors = FamilioExtendedColors(
    success = LightSuccess,
    warning = LightWarning,
    textMuted = LightTextMuted,
    surfaceAlt = LightSurfaceAlt,
)

private val DarkExtendedColors = FamilioExtendedColors(
    success = DarkSuccess,
    warning = DarkWarning,
    textMuted = DarkTextMuted,
    surfaceAlt = DarkSurfaceAlt,
)

val LocalFamilioExtendedColors = staticCompositionLocalOf { LightExtendedColors }

private val LightScheme = lightColorScheme(
    primary = LightPrimary,
    onPrimary = LightSurface,
    primaryContainer = LightPrimarySubtle,
    onPrimaryContainer = LightPrimary,
    secondary = LightAccent,
    onSecondary = LightSurface,
    background = LightBg,
    onBackground = LightText,
    surface = LightSurface,
    onSurface = LightText,
    surfaceVariant = LightSurfaceAlt,
    onSurfaceVariant = LightTextMuted,
    outline = LightBorder,
    error = ErrorRed,
)

private val DarkScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = DarkBg,
    primaryContainer = DarkPrimarySubtle,
    onPrimaryContainer = DarkPrimary,
    secondary = DarkAccent,
    onSecondary = DarkBg,
    background = DarkBg,
    onBackground = DarkText,
    surface = DarkSurface,
    onSurface = DarkText,
    surfaceVariant = DarkSurfaceAlt,
    onSurfaceVariant = DarkTextMuted,
    outline = DarkBorder,
    error = ErrorRed,
)

private val FamilioTypography = Typography(
    headlineSmall = TextStyle(fontWeight = FontWeight.Bold, fontSize = 28.sp),
    titleLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 20.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 15.sp),
    bodyLarge = TextStyle(fontSize = 15.sp),
    bodyMedium = TextStyle(fontSize = 13.sp),
    labelSmall = TextStyle(fontSize = 11.sp),
)

@Composable
fun FamilioTheme(
    themeMode: String = ThemeMode.SYSTEM,
    content: @Composable () -> Unit,
) {
    val darkTheme = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        else -> isSystemInDarkTheme()
    }
    val colorScheme = if (darkTheme) DarkScheme else LightScheme
    val extendedColors = if (darkTheme) DarkExtendedColors else LightExtendedColors

    CompositionLocalProvider(LocalFamilioExtendedColors provides extendedColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = FamilioTypography,
            content = content,
        )
    }
}

object FamilioTheme {
    val extendedColors: FamilioExtendedColors
        @Composable get() = LocalFamilioExtendedColors.current
}
