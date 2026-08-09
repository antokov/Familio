package com.kovacevic.familio.ui.calendar

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.Attendee
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.data.model.EventWriteRequest
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.ui.components.AvatarBadge
import com.kovacevic.familio.ui.components.AvatarSize
import com.kovacevic.familio.ui.parseApiDateTime
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

private enum class PickerTarget { NONE, START_DATE, START_TIME, END_DATE, END_TIME }

private val dateLabelFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy")
private val timeLabelFormatter = DateTimeFormatter.ofPattern("HH:mm")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventFormDialog(
    editEvent: CalendarEvent?,
    familyMembers: List<FamilyMember>,
    initialDate: String?,
    initialTime: String?,
    apiError: String?,
    saving: Boolean,
    onSave: (EventWriteRequest) -> Unit,
    onDelete: (() -> Unit)?,
    onDismiss: () -> Unit,
) {
    val defaultStart = editEvent?.let { parseApiDateTime(it.startDt) }
        ?: initialDate?.let { d ->
            LocalDateTime.of(LocalDate.parse(d), initialTime?.let { LocalTime.parse(it) } ?: LocalTime.of(9, 0))
        }
        ?: LocalDateTime.now().withMinute(0)
    val defaultEnd = editEvent?.let { parseApiDateTime(it.endDt) } ?: defaultStart.plusHours(1)

    var title by remember { mutableStateOf(editEvent?.title ?: "") }
    var description by remember { mutableStateOf(editEvent?.description ?: "") }
    var startDate by remember { mutableStateOf(defaultStart.toLocalDate()) }
    var startTime by remember { mutableStateOf(defaultStart.toLocalTime()) }
    var endDate by remember { mutableStateOf(defaultEnd.toLocalDate()) }
    var endTime by remember { mutableStateOf(defaultEnd.toLocalTime()) }
    var selectedMemberIds by remember {
        mutableStateOf(
            editEvent?.attendees
                ?.mapNotNull { attendee -> familyMembers.find { it.initials == attendee.initials && it.color == attendee.color }?.id }
                ?.toSet()
                ?: emptySet(),
        )
    }
    var allDay by remember { mutableStateOf(editEvent?.allDay ?: false) }
    var pickerTarget by remember { mutableStateOf(PickerTarget.NONE) }

    val startDateTime = LocalDateTime.of(startDate, startTime)
    val endDateTime = LocalDateTime.of(endDate, endTime)
    val isValid = title.isNotBlank() && (if (allDay) !endDate.isBefore(startDate) else endDateTime.isAfter(startDateTime))

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (editEvent != null) "Termin bearbeiten" else "Neuer Termin") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it.take(100) },
                    label = { Text("Titel") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it.take(500) },
                    label = { Text("Beschreibung") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Ganztägig")
                    Switch(
                        checked = allDay,
                        onCheckedChange = { checked ->
                            allDay = checked
                            if (checked && endDate.isBefore(startDate)) endDate = startDate
                        },
                    )
                }

                Text("Beginn", style = MaterialTheme.typography.labelSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PickerField(
                        value = startDate.format(dateLabelFormatter),
                        modifier = Modifier.weight(1f),
                        onClick = { pickerTarget = PickerTarget.START_DATE },
                    )
                    if (!allDay) {
                        PickerField(
                            value = startTime.format(timeLabelFormatter),
                            modifier = Modifier.weight(1f),
                            onClick = { pickerTarget = PickerTarget.START_TIME },
                        )
                    }
                }

                Text("Ende", style = MaterialTheme.typography.labelSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PickerField(
                        value = endDate.format(dateLabelFormatter),
                        modifier = Modifier.weight(1f),
                        onClick = { pickerTarget = PickerTarget.END_DATE },
                    )
                    if (!allDay) {
                        PickerField(
                            value = endTime.format(timeLabelFormatter),
                            modifier = Modifier.weight(1f),
                            onClick = { pickerTarget = PickerTarget.END_TIME },
                        )
                    }
                }
                val rangeInvalid = if (allDay) endDate.isBefore(startDate) else !endDateTime.isAfter(startDateTime)
                if (rangeInvalid) {
                    val message = if (allDay) "Ende muss am oder nach dem Beginn liegen" else "Ende muss nach Beginn liegen"
                    Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.labelSmall)
                }

                if (familyMembers.isNotEmpty()) {
                    Text("Teilnehmer", style = MaterialTheme.typography.labelSmall)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        familyMembers.forEach { member ->
                            val selected = member.id in selectedMemberIds
                            FilterChip(
                                selected = selected,
                                onClick = {
                                    selectedMemberIds = if (selected) selectedMemberIds - member.id else selectedMemberIds + member.id
                                },
                                label = { Text(member.name) },
                                leadingIcon = { AvatarBadge(initials = member.initials, color = member.color, size = AvatarSize.SM) },
                            )
                        }
                    }
                }

                if (apiError != null) {
                    Text(apiError, color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            Row {
                if (onDelete != null) {
                    TextButton(onClick = onDelete) { Text("Löschen", color = MaterialTheme.colorScheme.error) }
                }
                TextButton(
                    enabled = isValid && !saving,
                    onClick = {
                        val attendees = familyMembers
                            .filter { it.id in selectedMemberIds }
                            .map { Attendee(it.initials, it.color) }
                        val effectiveStart = if (allDay) LocalDateTime.of(startDate, LocalTime.MIDNIGHT) else startDateTime
                        val effectiveEnd = if (allDay) LocalDateTime.of(endDate, LocalTime.of(23, 59)) else endDateTime
                        onSave(
                            EventWriteRequest(
                                title = title.trim(),
                                description = description.trim().ifBlank { null },
                                startDt = effectiveStart.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                                endDt = effectiveEnd.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                                attendees = attendees,
                                allDay = allDay,
                            ),
                        )
                    },
                ) { Text(if (saving) "Speichern…" else if (editEvent != null) "Speichern" else "Hinzufügen") }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Abbrechen") }
        },
    )

    if (pickerTarget == PickerTarget.START_DATE || pickerTarget == PickerTarget.END_DATE) {
        val current = if (pickerTarget == PickerTarget.START_DATE) startDate else endDate
        val state = rememberDatePickerState(
            initialSelectedDateMillis = current.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli(),
        )
        DatePickerDialog(
            onDismissRequest = { pickerTarget = PickerTarget.NONE },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let { millis ->
                        val picked = Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate()
                        if (pickerTarget == PickerTarget.START_DATE) startDate = picked else endDate = picked
                    }
                    pickerTarget = PickerTarget.NONE
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { pickerTarget = PickerTarget.NONE }) { Text("Abbrechen") } },
        ) { DatePicker(state = state) }
    }

    if (pickerTarget == PickerTarget.START_TIME || pickerTarget == PickerTarget.END_TIME) {
        val current = if (pickerTarget == PickerTarget.START_TIME) startTime else endTime
        val state = rememberTimePickerState(initialHour = current.hour, initialMinute = current.minute, is24Hour = true)
        TimePickerDialog(
            state = state,
            onConfirm = {
                val picked = LocalTime.of(state.hour, state.minute)
                if (pickerTarget == PickerTarget.START_TIME) startTime = picked else endTime = picked
                pickerTarget = PickerTarget.NONE
            },
            onDismiss = { pickerTarget = PickerTarget.NONE },
        )
    }
}

@Composable
private fun PickerField(value: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(4.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 14.dp),
    ) {
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}
