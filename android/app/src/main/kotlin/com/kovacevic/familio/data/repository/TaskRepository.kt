package com.kovacevic.familio.data.repository

import com.kovacevic.familio.data.model.Task
import com.kovacevic.familio.data.model.TaskCompletedRequest
import com.kovacevic.familio.data.model.TaskWriteRequest
import com.kovacevic.familio.data.remote.ApiService

class TaskRepository(private val api: ApiService) {
    suspend fun getTasks(completed: Boolean? = null): Result<List<Task>> =
        safeApiCall { api.getTasks(completed) }

    suspend fun createTask(input: TaskWriteRequest): Result<Task> =
        safeApiCall { api.createTask(input) }

    suspend fun updateTask(id: String, input: TaskWriteRequest): Result<Task> =
        safeApiCall { api.updateTask(id, input) }

    suspend fun setCompleted(id: String, completed: Boolean): Result<Task> =
        safeApiCall { api.setTaskCompleted(id, TaskCompletedRequest(completed)) }

    suspend fun deleteTask(id: String): Result<Unit> =
        safeApiCall { api.deleteTask(id) }
}
