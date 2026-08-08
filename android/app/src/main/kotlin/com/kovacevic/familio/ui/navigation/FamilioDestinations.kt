package com.kovacevic.familio.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.ui.graphics.vector.ImageVector

sealed class FamilioDestination(val route: String, val label: String, val icon: ImageVector) {
    data object Dashboard : FamilioDestination("dashboard", "Dashboard", Icons.Filled.Home)
    data object Calendar : FamilioDestination("calendar", "Kalender", Icons.Filled.CalendarMonth)
    data object Tasks : FamilioDestination("tasks", "Aufgaben", Icons.Filled.Checklist)
    data object Shopping : FamilioDestination("shopping", "Einkauf", Icons.Filled.ShoppingCart)
    data object Documents : FamilioDestination("documents", "Dokumente", Icons.Filled.Description)
    data object Settings : FamilioDestination("settings", "Einstellungen", Icons.Filled.Settings)
}

val BOTTOM_NAV_DESTINATIONS = listOf(
    FamilioDestination.Dashboard,
    FamilioDestination.Calendar,
    FamilioDestination.Tasks,
    FamilioDestination.Shopping,
    FamilioDestination.Documents,
)
