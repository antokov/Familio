package com.kovacevic.familio.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.ui.components.parseHexColor
import com.kovacevic.familio.ui.parseApiDateTime
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.TextStyle
import java.time.temporal.TemporalAdjusters
import java.util.Locale

private val WEEKDAYS = listOf(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)

@Composable
fun MonthView(
    year: Int,
    month: Int,
    events: List<CalendarEvent>,
    today: LocalDate,
    onDayClick: (LocalDate) -> Unit,
    onEventClick: (CalendarEvent) -> Unit,
) {
    val firstOfMonth = LocalDate.of(year, month, 1)
    val gridStart = firstOfMonth.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
    val days = (0 until 42).map { gridStart.plusDays(it.toLong()) }
    val eventsByDay = events.groupBy { parseApiDateTime(it.startDt).toLocalDate() }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth()) {
            WEEKDAYS.forEach { dow ->
                Text(
                    dow.getDisplayName(TextStyle.SHORT, Locale.GERMAN),
                    modifier = Modifier.weight(1f).padding(4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        days.chunked(7).forEach { week ->
            Row(modifier = Modifier.fillMaxWidth()) {
                week.forEach { day ->
                    DayCell(
                        day = day,
                        inCurrentMonth = day.month == firstOfMonth.month,
                        isToday = day == today,
                        events = eventsByDay[day].orEmpty(),
                        onDayClick = onDayClick,
                        onEventClick = onEventClick,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun DayCell(
    day: LocalDate,
    inCurrentMonth: Boolean,
    isToday: Boolean,
    events: List<CalendarEvent>,
    onDayClick: (LocalDate) -> Unit,
    onEventClick: (CalendarEvent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .height(76.dp)
            .padding(1.dp)
            .clip(RoundedCornerShape(6.dp))
            .then(if (isToday) Modifier.border(1.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(6.dp)) else Modifier)
            .background(MaterialTheme.colorScheme.surface)
            .clickable { onDayClick(day) }
            .padding(4.dp),
    ) {
        Text(
            day.dayOfMonth.toString(),
            style = MaterialTheme.typography.labelSmall,
            color = if (inCurrentMonth) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
        )
        val shown = events.take(2)
        shown.forEach { event ->
            val color = event.attendees.firstOrNull()?.color?.let { parseHexColor(it) } ?: MaterialTheme.colorScheme.primary
            Text(
                event.title,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 1.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(color.copy(alpha = 0.85f))
                    .clickable { onEventClick(event) }
                    .padding(horizontal = 3.dp, vertical = 1.dp),
                style = MaterialTheme.typography.labelSmall,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (events.size > 2) {
            Text(
                "+${events.size - 2} mehr",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
