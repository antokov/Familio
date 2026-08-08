package com.kovacevic.familio.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.ui.components.parseHexColor
import com.kovacevic.familio.ui.parseApiDateTime
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.TextStyle
import java.util.Locale

private val HOUR_HEIGHT = 48.dp
private val TIME_AXIS_WIDTH = 36.dp

@Composable
fun WeekView(
    weekStart: LocalDate,
    events: List<CalendarEvent>,
    today: LocalDate,
    onSlotClick: (LocalDate, LocalTime) -> Unit,
    onEventClick: (CalendarEvent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val days = (0 until 7).map { weekStart.plusDays(it.toLong()) }
    val eventsByDay = events.groupBy { parseApiDateTime(it.startDt).toLocalDate() }

    Column(modifier = modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth()) {
            Spacer(Modifier.width(TIME_AXIS_WIDTH))
            days.forEach { day ->
                val isToday = day == today
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        day.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.GERMAN),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        day.dayOfMonth.toString(),
                        style = MaterialTheme.typography.titleMedium,
                        color = if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
        }
        HorizontalDivider()
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .verticalScroll(rememberScrollState()),
        ) {
            TimeAxis()
            days.forEach { day ->
                DayColumn(
                    day = day,
                    events = eventsByDay[day].orEmpty(),
                    onSlotClick = onSlotClick,
                    onEventClick = onEventClick,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun TimeAxis() {
    Column(modifier = Modifier.width(TIME_AXIS_WIDTH)) {
        for (hour in 0 until 24) {
            Box(modifier = Modifier.height(HOUR_HEIGHT), contentAlignment = Alignment.TopCenter) {
                Text("%02d".format(hour), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun DayColumn(
    day: LocalDate,
    events: List<CalendarEvent>,
    onSlotClick: (LocalDate, LocalTime) -> Unit,
    onEventClick: (CalendarEvent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.height(HOUR_HEIGHT * 24)) {
        Column(modifier = Modifier.fillMaxWidth()) {
            for (hour in 0 until 24) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(HOUR_HEIGHT)
                        .clickable { onSlotClick(day, LocalTime.of(hour, 0)) },
                ) {
                    HorizontalDivider(modifier = Modifier.fillMaxWidth())
                }
            }
        }
        events.forEach { event ->
            val start = parseApiDateTime(event.startDt)
            val end = parseApiDateTime(event.endDt)
            val startFraction = start.hour + start.minute / 60f
            val durationHours = (java.time.Duration.between(start, end).toMinutes() / 60f).coerceAtLeast(0.5f)
            val color = event.attendees.firstOrNull()?.color?.let { parseHexColor(it) } ?: MaterialTheme.colorScheme.primary
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 2.dp)
                    .offset(y = HOUR_HEIGHT * startFraction)
                    .height(HOUR_HEIGHT * durationHours)
                    .clip(RoundedCornerShape(4.dp))
                    .background(color.copy(alpha = 0.85f))
                    .clickable { onEventClick(event) }
                    .padding(4.dp),
            ) {
                Text(
                    event.title,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}
