package com.kovacevic.familio.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.kovacevic.familio.ui.calendar.CalendarScreen
import com.kovacevic.familio.ui.dashboard.DashboardScreen
import com.kovacevic.familio.ui.documents.DocumentsScreen
import com.kovacevic.familio.ui.navigation.BOTTOM_NAV_DESTINATIONS
import com.kovacevic.familio.ui.navigation.FamilioDestination
import com.kovacevic.familio.ui.navigation.LocalTabNavigator
import com.kovacevic.familio.ui.settings.SettingsScreen
import com.kovacevic.familio.ui.shopping.ShoppingScreen
import com.kovacevic.familio.ui.tasks.TasksScreen
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    pendingDeepLinkRoute: String? = null,
    onDeepLinkConsumed: () -> Unit = {},
) {
    val pagerState = rememberPagerState(pageCount = { BOTTOM_NAV_DESTINATIONS.size })
    val scope = rememberCoroutineScope()
    var showSettings by rememberSaveable { mutableStateOf(false) }

    BackHandler(enabled = showSettings) { showSettings = false }

    val currentLabel = if (showSettings) {
        FamilioDestination.Settings.label
    } else {
        BOTTOM_NAV_DESTINATIONS[pagerState.currentPage].label
    }

    val navigateToTab: (String) -> Unit = { route ->
        showSettings = false
        val index = BOTTOM_NAV_DESTINATIONS.indexOfFirst { it.route == route }
        if (index >= 0) scope.launch { pagerState.animateScrollToPage(index) }
    }

    LaunchedEffect(pendingDeepLinkRoute) {
        if (pendingDeepLinkRoute != null) {
            navigateToTab(pendingDeepLinkRoute)
            onDeepLinkConsumed()
        }
    }

    CompositionLocalProvider(LocalTabNavigator provides navigateToTab) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(currentLabel) },
                    actions = {
                        if (!showSettings) {
                            IconButton(onClick = { showSettings = true }) {
                                Icon(Icons.Filled.Settings, contentDescription = FamilioDestination.Settings.label)
                            }
                        }
                    },
                )
            },
            bottomBar = {
                NavigationBar {
                    BOTTOM_NAV_DESTINATIONS.forEachIndexed { index, destination ->
                        NavigationBarItem(
                            selected = !showSettings && pagerState.currentPage == index,
                            onClick = {
                                showSettings = false
                                scope.launch { pagerState.animateScrollToPage(index) }
                            },
                            icon = { Icon(destination.icon, contentDescription = destination.label) },
                            label = { Text(destination.label) },
                        )
                    }
                }
            },
        ) { innerPadding ->
            if (showSettings) {
                SettingsScreen(modifier = Modifier.padding(innerPadding))
            } else {
                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier.padding(innerPadding),
                ) { page ->
                    when (BOTTOM_NAV_DESTINATIONS[page]) {
                        FamilioDestination.Dashboard -> DashboardScreen()
                        FamilioDestination.Calendar -> CalendarScreen()
                        FamilioDestination.Tasks -> TasksScreen()
                        FamilioDestination.Shopping -> ShoppingScreen()
                        FamilioDestination.Documents -> DocumentsScreen()
                        FamilioDestination.Settings -> Unit
                    }
                }
            }
        }
    }
}
