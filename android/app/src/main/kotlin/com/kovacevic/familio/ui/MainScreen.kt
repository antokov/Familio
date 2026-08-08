package com.kovacevic.familio.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.kovacevic.familio.ui.navigation.BOTTOM_NAV_DESTINATIONS
import com.kovacevic.familio.ui.navigation.FamilioDestination
import com.kovacevic.familio.ui.navigation.FamilioNavHost
import com.kovacevic.familio.ui.navigation.LocalFamilioNavController
import com.kovacevic.familio.ui.navigation.navigateToTab

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val currentLabel = BOTTOM_NAV_DESTINATIONS.find { it.route == currentRoute }?.label
        ?: FamilioDestination.Settings.label.takeIf { currentRoute == FamilioDestination.Settings.route }
        ?: "Familio"

    CompositionLocalProvider(LocalFamilioNavController provides navController) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(currentLabel) },
                    actions = {
                        if (currentRoute != FamilioDestination.Settings.route) {
                            IconButton(onClick = {
                                navController.navigate(FamilioDestination.Settings.route) {
                                    launchSingleTop = true
                                }
                            }) {
                                Icon(Icons.Filled.Settings, contentDescription = FamilioDestination.Settings.label)
                            }
                        }
                    },
                )
            },
            bottomBar = {
                NavigationBar {
                    BOTTOM_NAV_DESTINATIONS.forEach { destination ->
                        val selected = backStackEntry?.destination?.hierarchy
                            ?.any { it.route == destination.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = { navController.navigateToTab(destination.route) },
                            icon = { Icon(destination.icon, contentDescription = destination.label) },
                            label = { Text(destination.label) },
                        )
                    }
                }
            },
        ) { innerPadding ->
            FamilioNavHost(navController = navController, innerPadding = innerPadding)
        }
    }
}
