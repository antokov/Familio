package com.kovacevic.familio.ui.navigation

import androidx.compose.runtime.staticCompositionLocalOf

/**
 * Lets any screen jump to a bottom-nav tab (by [FamilioDestination.route]) without knowing that
 * tabs are implemented as pages of a HorizontalPager — provided by [com.kovacevic.familio.ui.MainScreen].
 */
val LocalTabNavigator = staticCompositionLocalOf<(String) -> Unit> {
    error("No tab navigator provided")
}
