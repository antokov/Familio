package com.kovacevic.familio.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.compose.foundation.layout.PaddingValues
import com.kovacevic.familio.ui.calendar.CalendarScreen
import com.kovacevic.familio.ui.dashboard.DashboardScreen
import com.kovacevic.familio.ui.documents.DocumentsScreen
import com.kovacevic.familio.ui.settings.SettingsScreen
import com.kovacevic.familio.ui.shopping.ShoppingScreen
import com.kovacevic.familio.ui.tasks.TasksScreen

@Composable
fun FamilioNavHost(
    navController: NavHostController,
    innerPadding: PaddingValues,
) {
    NavHost(
        navController = navController,
        startDestination = FamilioDestination.Dashboard.route,
        modifier = Modifier.padding(innerPadding),
    ) {
        composable(FamilioDestination.Dashboard.route) { DashboardScreen() }
        composable(FamilioDestination.Calendar.route) { CalendarScreen() }
        composable(FamilioDestination.Tasks.route) { TasksScreen() }
        composable(FamilioDestination.Shopping.route) { ShoppingScreen() }
        composable(FamilioDestination.Documents.route) { DocumentsScreen() }
        composable(FamilioDestination.Settings.route) { SettingsScreen() }
    }
}
