package com.kovacevic.familio.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.ui.components.parseHexColor
import com.kovacevic.familio.ui.formatEventTime
import com.kovacevic.familio.ui.germanFullDate
import java.time.LocalDate

@Composable
fun DayEventsDialog(
    date: LocalDate,
    events: List<CalendarEvent>,
    onEventClick: (CalendarEvent) -> Unit,
    onAddEvent: () -> Unit,
    onDismiss: () -> Unit,
) {
    val sorted = events.sortedBy { if (it.allDay) "" else it.startDt }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(germanFullDate(date)) },
        text = {
            LazyColumn {
                items(sorted, key = { it.id }) { event ->
                    val color = event.attendees.firstOrNull()?.color?.let { parseHexColor(it) } ?: MaterialTheme.colorScheme.primary
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onEventClick(event) }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(color),
                        )
                        Text(event.title, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyLarge)
                        Text(
                            if (event.allDay) "Ganztägig" else formatEventTime(event.startDt),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onAddEvent) { Text("Neuer Termin") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Schließen") }
        },
    )
}
