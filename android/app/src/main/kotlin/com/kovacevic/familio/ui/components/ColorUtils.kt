package com.kovacevic.familio.ui.components

import androidx.compose.ui.graphics.Color

fun parseHexColor(hex: String, fallback: Color = Color(0xFF7A7F9A)): Color =
    try {
        Color(android.graphics.Color.parseColor(hex))
    } catch (_: IllegalArgumentException) {
        fallback
    }
