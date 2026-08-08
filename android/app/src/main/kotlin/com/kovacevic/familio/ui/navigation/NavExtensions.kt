package com.kovacevic.familio.ui.navigation

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController

val LocalFamilioNavController = staticCompositionLocalOf<NavHostController> {
    error("No NavHostController provided")
}

fun NavHostController.navigateToTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
