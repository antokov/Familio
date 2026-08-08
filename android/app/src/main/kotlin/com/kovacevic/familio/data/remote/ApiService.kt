package com.kovacevic.familio.data.remote

import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.data.model.Document
import com.kovacevic.familio.data.model.EventWriteRequest
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.model.FamilyMemberWriteRequest
import com.kovacevic.familio.data.model.HealthResponse
import com.kovacevic.familio.data.model.ShoppingCheckedRequest
import com.kovacevic.familio.data.model.ShoppingItem
import com.kovacevic.familio.data.model.ShoppingItemWriteRequest
import com.kovacevic.familio.data.model.Task
import com.kovacevic.familio.data.model.TaskCompletedRequest
import com.kovacevic.familio.data.model.TaskWriteRequest
import kotlinx.serialization.json.JsonObject
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Streaming
import retrofit2.http.POST

interface ApiService {

    @GET("health")
    suspend fun health(): HealthResponse

    // ---- Tasks ----
    @GET("api/tasks")
    suspend fun getTasks(@Query("completed") completed: Boolean? = null): List<Task>

    @POST("api/tasks")
    suspend fun createTask(@Body body: TaskWriteRequest): Task

    @PUT("api/tasks/{id}")
    suspend fun updateTask(@Path("id") id: String, @Body body: TaskWriteRequest): Task

    @PUT("api/tasks/{id}")
    suspend fun setTaskCompleted(@Path("id") id: String, @Body body: TaskCompletedRequest): Task

    @DELETE("api/tasks/{id}")
    suspend fun deleteTask(@Path("id") id: String)

    // ---- Events ----
    @GET("api/events")
    suspend fun getEvents(@Query("from") from: String, @Query("to") to: String): List<CalendarEvent>

    @POST("api/events")
    suspend fun createEvent(@Body body: EventWriteRequest): CalendarEvent

    @PUT("api/events/{id}")
    suspend fun updateEvent(@Path("id") id: String, @Body body: EventWriteRequest): CalendarEvent

    @DELETE("api/events/{id}")
    suspend fun deleteEvent(@Path("id") id: String)

    // ---- Family members ----
    @GET("api/family-members")
    suspend fun getFamilyMembers(): List<FamilyMember>

    @POST("api/family-members")
    suspend fun createFamilyMember(@Body body: FamilyMemberWriteRequest): FamilyMember

    @PUT("api/family-members/{id}")
    suspend fun updateFamilyMember(@Path("id") id: String, @Body body: FamilyMemberWriteRequest): FamilyMember

    @DELETE("api/family-members/{id}")
    suspend fun deleteFamilyMember(@Path("id") id: String)

    // ---- Shopping ----
    @GET("api/shopping")
    suspend fun getShoppingItems(): List<ShoppingItem>

    @POST("api/shopping")
    suspend fun createShoppingItem(@Body body: ShoppingItemWriteRequest): ShoppingItem

    @PUT("api/shopping/{id}")
    suspend fun updateShoppingItem(@Path("id") id: String, @Body body: ShoppingItemWriteRequest): ShoppingItem

    @PUT("api/shopping/{id}")
    suspend fun setShoppingChecked(@Path("id") id: String, @Body body: ShoppingCheckedRequest): ShoppingItem

    @DELETE("api/shopping/{id}")
    suspend fun deleteShoppingItem(@Path("id") id: String)

    // ---- Documents ----
    @GET("api/documents")
    suspend fun getDocuments(): List<Document>

    @Multipart
    @POST("api/documents")
    suspend fun uploadDocument(
        @Part file: MultipartBody.Part,
        @Part("family_member_id") familyMemberId: RequestBody?,
    ): Document

    @PUT("api/documents/{id}")
    suspend fun updateDocument(@Path("id") id: String, @Body body: JsonObject): Document

    @Streaming
    @GET("api/documents/{id}/download")
    suspend fun downloadDocument(@Path("id") id: String): ResponseBody

    @DELETE("api/documents/{id}")
    suspend fun deleteDocument(@Path("id") id: String)
}
