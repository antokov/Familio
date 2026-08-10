package com.kovacevic.familio.ui.calendar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.eventDateRange
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.TextStyle
import java.util.Locale
import kotlinx.coroutines.launch

private val MONTH_NAMES_DE = (1..12).associateWith {
    java.time.Month.of(it).getDisplayName(TextStyle.FULL, Locale.GERMAN)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(modifier: Modifier = Modifier) {
    val container = LocalContext.current.familioContainer()
    val viewModel: CalendarViewModel = viewModel(
        factory = viewModelFactory {
            initializer { CalendarViewModel(container.eventRepository, container.familyMemberRepository) }
        },
    )
    val uiState by viewModel.uiState.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadEvents() }
    val scope = rememberCoroutineScope()
    val today = LocalDate.now()

    var showDialog by remember { mutableStateOf(false) }
    var editingEvent by remember { mutableStateOf<CalendarEvent?>(null) }
    var dialogDate by remember { mutableStateOf<String?>(null) }
    var dialogTime by remember { mutableStateOf<String?>(null) }
    var formSaving by remember { mutableStateOf(false) }
    var formError by remember { mutableStateOf<String?>(null) }
    var dayDetailDate by remember { mutableStateOf<LocalDate?>(null) }

    fun openNew(date: LocalDate? = null, time: LocalTime? = null) {
        editingEvent = null
        dialogDate = date?.toString()
        dialogTime = time?.toString()
        formError = null
        showDialog = true
    }

    fun openEdit(event: CalendarEvent) {
        editingEvent = event
        dialogDate = null
        dialogTime = null
        formError = null
        showDialog = true
    }

    Scaffold(
        modifier = modifier,
        floatingActionButton = {
            FloatingActionButton(onClick = { openNew() }) {
                Icon(Icons.Filled.Add, contentDescription = "Neuer Termin")
            }
        },
    ) { innerPadding ->
        Column(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { viewModel.navigate(-1) }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Zurück")
                    }
                    IconButton(onClick = { viewModel.navigate(1) }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Weiter")
                    }
                    Text(calendarHeaderTitle(uiState.view, uiState.selectedDate, uiState.weekStart), style = MaterialTheme.typography.titleMedium)
                }
            }
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                SegmentedButton(
                    selected = uiState.view == CalendarViewType.MONTH,
                    onClick = { viewModel.setView(CalendarViewType.MONTH) },
                    shape = SegmentedButtonDefaults.itemShape(0, 2),
                ) { Text("Monat") }
                SegmentedButton(
                    selected = uiState.view == CalendarViewType.WEEK,
                    onClick = { viewModel.setView(CalendarViewType.WEEK) },
                    shape = SegmentedButtonDefaults.itemShape(1, 2),
                ) { Text("Woche") }
            }

            when {
                uiState.error != null -> Text(
                    uiState.error ?: "",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error,
                )
                uiState.loading -> Text("Lädt…", modifier = Modifier.padding(16.dp))
                uiState.view == CalendarViewType.MONTH -> Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                    MonthView(
                        year = uiState.selectedDate.year,
                        month = uiState.selectedDate.monthValue,
                        events = uiState.events,
                        today = today,
                        onDayClick = { date -> openNew(date) },
                        onEventClick = { event -> openEdit(event) },
                        onShowMore = { date -> dayDetailDate = date },
                    )
                }
                else -> Box(modifier = Modifier.weight(1f)) {
                    WeekView(
                        weekStart = uiState.weekStart,
                        events = uiState.events,
                        today = today,
                        onSlotClick = { date, time -> openNew(date, time) },
                        onEventClick = { event -> openEdit(event) },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }
        }
    }

    if (showDialog) {
        EventFormDialog(
            editEvent = editingEvent,
            familyMembers = uiState.familyMembers,
            initialDate = dialogDate,
            initialTime = dialogTime,
            apiError = formError,
            saving = formSaving,
            onDismiss = { showDialog = false },
            onDelete = editingEvent?.let { event ->
                { viewModel.deleteEvent(event.id); showDialog = false }
            },
            onSave = { input ->
                scope.launch {
                    formSaving = true
                    val error = if (editingEvent != null) {
                        viewModel.updateEvent(editingEvent!!.id, input)
                    } else {
                        viewModel.createEvent(input)
                    }
                    formSaving = false
                    if (error == null) {
                        showDialog = false
                        formError = null
                    } else {
                        formError = error
                    }
                }
            },
        )
    }

    dayDetailDate?.let { date ->
        DayEventsDialog(
            date = date,
            events = uiState.events.filter { date in eventDateRange(it) },
            onEventClick = { event -> dayDetailDate = null; openEdit(event) },
            onAddEvent = { dayDetailDate = null; openNew(date) },
            onDismiss = { dayDetailDate = null },
        )
    }
}

private fun calendarHeaderTitle(view: CalendarViewType, selectedDate: LocalDate, weekStart: LocalDate): String {
    if (view == CalendarViewType.MONTH) {
        return "${MONTH_NAMES_DE[selectedDate.monthValue]} ${selectedDate.year}"
    }
    val weekEnd = weekStart.plusDays(6)
    return if (weekStart.month == weekEnd.month) {
        "${weekStart.dayOfMonth}. – ${weekEnd.dayOfMonth}. ${MONTH_NAMES_DE[weekStart.monthValue]} ${weekEnd.year}"
    } else {
        "${weekStart.dayOfMonth}. ${MONTH_NAMES_DE[weekStart.monthValue]} – ${weekEnd.dayOfMonth}. ${MONTH_NAMES_DE[weekEnd.monthValue]} ${weekEnd.year}"
    }
}
