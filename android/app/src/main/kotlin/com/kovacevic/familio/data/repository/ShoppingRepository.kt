package com.kovacevic.familio.data.repository

import com.kovacevic.familio.data.model.ShoppingCheckedRequest
import com.kovacevic.familio.data.model.ShoppingItem
import com.kovacevic.familio.data.model.ShoppingItemWriteRequest
import com.kovacevic.familio.data.remote.ApiService

class ShoppingRepository(private val api: ApiService) {
    suspend fun getItems(): Result<List<ShoppingItem>> =
        safeApiCall { api.getShoppingItems() }

    suspend fun createItem(input: ShoppingItemWriteRequest): Result<ShoppingItem> =
        safeApiCall { api.createShoppingItem(input) }

    suspend fun updateItem(id: String, input: ShoppingItemWriteRequest): Result<ShoppingItem> =
        safeApiCall { api.updateShoppingItem(id, input) }

    suspend fun setChecked(id: String, checked: Boolean): Result<ShoppingItem> =
        safeApiCall { api.setShoppingChecked(id, ShoppingCheckedRequest(checked)) }

    suspend fun deleteItem(id: String): Result<Unit> =
        safeApiCall { api.deleteShoppingItem(id) }
}
