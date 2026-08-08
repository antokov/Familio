package com.kovacevic.familio.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.data.model.ShoppingItem
import com.kovacevic.familio.data.model.Task
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.components.AvatarBadge
import com.kovacevic.familio.ui.components.AvatarSize
import com.kovacevic.familio.ui.formatEventDate
import com.kovacevic.familio.ui.formatEventTime
import com.kovacevic.familio.ui.germanFullDate
import com.kovacevic.familio.ui.germanGreeting
import com.kovacevic.familio.ui.isOverdue
import com.kovacevic.familio.ui.navigation.FamilioDestination
import com.kovacevic.familio.ui.navigation.LocalFamilioNavController
import com.kovacevic.familio.ui.navigation.navigateToTab
import com.kovacevic.familio.ui.theme.FamilioTheme

@Composable
fun DashboardScreen(modifier: Modifier = Modifier) {
    val container = LocalContext.current.familioContainer()
    val viewModel: DashboardViewModel = viewModel(
        factory = viewModelFactory {
            initializer {
                DashboardViewModel(
                    container.taskRepository,
                    container.eventRepository,
                    container.shoppingRepository,
                )
            }
        },
    )
    val uiState by viewModel.uiState.collectAsState()
    val navController = LocalFamilioNavController.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text("${germanGreeting()}, Anton", style = MaterialTheme.typography.headlineSmall)
                Text(germanFullDate(), style = MaterialTheme.typography.bodyMedium, color = FamilioTheme.extendedColors.textMuted)
            }
            AvatarBadge(initials = "A", color = "#5B6AF0", online = true, size = AvatarSize.LG)
        }

        DashboardWidgetCard(
            icon = Icons.Filled.CalendarMonth,
            title = "Kalender",
            onViewAll = { navController.navigateToTab(FamilioDestination.Calendar.route) },
        ) {
            when {
                uiState.eventsLoading -> WidgetStateText("Lädt…")
                uiState.eventsError -> WidgetStateText("Termine konnten nicht geladen werden", isError = true)
                uiState.events.isEmpty() -> WidgetStateText("Keine anstehenden Termine")
                else -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    uiState.events.forEach { EventRow(it) }
                }
            }
        }

        DashboardWidgetCard(
            icon = Icons.Filled.Checklist,
            title = "Aufgaben",
            onViewAll = { navController.navigateToTab(FamilioDestination.Tasks.route) },
        ) {
            when {
                uiState.tasksLoading -> WidgetStateText("Lädt…")
                uiState.tasksError -> WidgetStateText("Aufgaben konnten nicht geladen werden", isError = true)
                uiState.tasks.isEmpty() -> WidgetStateText("Keine offenen Aufgaben")
                else -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    uiState.tasks.forEach { TaskRow(it) }
                }
            }
        }

        DashboardWidgetCard(
            icon = Icons.Filled.ShoppingCart,
            title = "Wocheneinkauf",
            onViewAll = { navController.navigateToTab(FamilioDestination.Shopping.route) },
        ) {
            val items = uiState.shoppingItems
            when {
                uiState.shoppingLoading -> WidgetStateText("Lädt…")
                uiState.shoppingError -> WidgetStateText("Einkaufsliste konnte nicht geladen werden", isError = true)
                items.isEmpty() -> WidgetStateText("Keine Artikel in der Einkaufsliste")
                else -> {
                    val checkedCount = items.count { it.checked }
                    val displayItems = (items.filterNot { it.checked } + items.filter { it.checked }).take(6)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        LinearProgressIndicator(
                            progress = { checkedCount.toFloat() / items.size },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                        )
                        Text(
                            "$checkedCount von ${items.size} erledigt",
                            style = MaterialTheme.typography.bodyMedium,
                            color = FamilioTheme.extendedColors.textMuted,
                        )
                        displayItems.forEach { item ->
                            Text(
                                item.name,
                                style = MaterialTheme.typography.bodyMedium,
                                textDecoration = if (item.checked) TextDecoration.LineThrough else TextDecoration.None,
                                color = if (item.checked) FamilioTheme.extendedColors.textMuted else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EventRow(event: CalendarEvent) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.width(72.dp)) {
            Text(formatEventDate(event.startDt), style = MaterialTheme.typography.labelSmall, color = FamilioTheme.extendedColors.textMuted)
            Text(formatEventTime(event.startDt), style = MaterialTheme.typography.labelSmall, color = FamilioTheme.extendedColors.textMuted)
        }
        Text(event.title, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun TaskRow(task: Task) {
    val overdue = isOverdue(task.dueDate)
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (task.assigneeInitials != null && task.assigneeColor != null) {
            AvatarBadge(initials = task.assigneeInitials, color = task.assigneeColor, size = AvatarSize.SM)
        }
        Text(
            task.title,
            style = MaterialTheme.typography.bodyLarge,
            color = if (overdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
        )
        if (overdue) {
            Text(
                "Überfällig",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.error,
            )
        }
    }
}
