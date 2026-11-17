package com.recoverx.app.data

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import androidx.documentfile.provider.DocumentFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

enum class ScanCategory(val label: String) {
    PHOTOS("Photos"),
    VIDEOS("Videos"),
    CONTACTS("Contacts"),
    DOCUMENTS("Documents"),
    AUDIO("Audio")
}

data class ScanItem(
    val uri: Uri,
    val name: String,
    val mimeType: String,
    val sizeBytes: Long,
    val category: ScanCategory,
    val contactVCard: String? = null
)

class ScanRepository(private val context: Context) {
    suspend fun scan(categories: List<ScanCategory>, documentTree: Uri? = null): List<ScanItem> =
        withContext(Dispatchers.IO) {
            categories.distinct().flatMap { category ->
                when (category) {
                    ScanCategory.PHOTOS -> scanMedia(category)
                    ScanCategory.VIDEOS -> scanMedia(category)
                    ScanCategory.AUDIO -> scanMedia(category)
                    ScanCategory.CONTACTS -> scanContacts()
                    ScanCategory.DOCUMENTS -> scanDocuments(
                        documentTree ?: error("Choose a folder before scanning documents.")
                    )
                }
            }
        }

    private fun scanMedia(category: ScanCategory): List<ScanItem> {
        requireMediaPermission(category)
        val collection = when (category) {
            ScanCategory.PHOTOS -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            ScanCategory.VIDEOS -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            ScanCategory.AUDIO -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            else -> error("Unsupported media category: $category")
        }
        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.SIZE
        )
        val results = mutableListOf<ScanItem>()
        val cursor = context.contentResolver.query(
            collection,
            projection,
            null,
            null,
            "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
        ) ?: error("Android could not query ${category.label.lowercase()} storage.")
        cursor.use {
            val idColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
            val nameColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
            val mimeColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.MIME_TYPE)
            val sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE)
            while (cursor.moveToNext()) {
                val id = cursor.getLong(idColumn)
                results += ScanItem(
                    uri = ContentUris.withAppendedId(collection, id),
                    name = cursor.getString(nameColumn) ?: category.label,
                    mimeType = cursor.getString(mimeColumn) ?: "application/octet-stream",
                    sizeBytes = cursor.getLong(sizeColumn),
                    category = category
                )
            }
        }
        return results
    }

    private fun scanContacts(): List<ScanItem> {
        checkPermission(android.Manifest.permission.READ_CONTACTS)
        val results = mutableListOf<ScanItem>()
        val projection = arrayOf(
            ContactsContract.Contacts._ID,
            ContactsContract.Contacts.DISPLAY_NAME
        )
        val cursor = context.contentResolver.query(
            ContactsContract.Contacts.CONTENT_URI,
            projection,
            null,
            null,
            "${ContactsContract.Contacts.DISPLAY_NAME} COLLATE NOCASE ASC"
        ) ?: error("Android could not query contacts.")
        cursor.use {
            val idColumn = cursor.getColumnIndexOrThrow(ContactsContract.Contacts._ID)
            val nameColumn = cursor.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME)
            while (cursor.moveToNext()) {
                val id = cursor.getLong(idColumn)
                val name = cursor.getString(nameColumn).orEmpty()
                results += ScanItem(
                    uri = ContentUris.withAppendedId(ContactsContract.Contacts.CONTENT_URI, id),
                    name = name.ifBlank { "Contact" },
                    mimeType = "text/vcard",
                    sizeBytes = 0,
                    category = ScanCategory.CONTACTS,
                    contactVCard = readVCard(id, name)
                )
            }
        }
        return results
    }

    private fun readVCard(contactId: Long, displayName: String): String {
        val projection = arrayOf(
            ContactsContract.Data.MIMETYPE,
            ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME,
            ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Email.ADDRESS
        )
        val cursor = context.contentResolver.query(
            ContactsContract.Data.CONTENT_URI,
            projection,
            "${ContactsContract.Data.CONTACT_ID} = ? AND " +
                "(${ContactsContract.Data.MIMETYPE} = ? OR ${ContactsContract.Data.MIMETYPE} = ? OR " +
                "${ContactsContract.Data.MIMETYPE} = ?)",
            arrayOf(
                contactId.toString(),
                ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
                ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE,
                ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE
            ),
            null
        )
        val phones = mutableListOf<String>()
        val emails = mutableListOf<String>()
        var firstName = ""
        var lastName = ""
        val contactCursor = cursor ?: error("Android could not read contact details.")
        contactCursor.use {
            while (it.moveToNext()) {
                when (it.getString(it.getColumnIndexOrThrow(ContactsContract.Data.MIMETYPE))) {
                    ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE -> {
                        firstName = it.getString(
                            it.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME)
                        ).orEmpty()
                        lastName = it.getString(
                            it.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME)
                        ).orEmpty()
                    }
                    ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> {
                        phones += it.getString(
                            it.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER)
                        ).orEmpty()
                    }
                    ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE -> {
                        emails += it.getString(
                            it.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Email.ADDRESS)
                        ).orEmpty()
                    }
                }
            }
        }
        return buildString {
            appendLine("BEGIN:VCARD")
            appendLine("VERSION:3.0")
            appendLine("FN:${escapeVCard(displayName)}")
            appendLine("N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;")
            phones.forEach { appendLine("TEL:${escapeVCard(it)}") }
            emails.forEach { appendLine("EMAIL:${escapeVCard(it)}") }
            appendLine("END:VCARD")
        }
    }

    private fun scanDocuments(treeUri: Uri): List<ScanItem> {
        val root = DocumentFile.fromTreeUri(context, treeUri)
            ?: error("The selected folder could not be opened.")
        val results = mutableListOf<ScanItem>()
        val pending = ArrayDeque<DocumentFile>()
        pending.add(root)
        while (pending.isNotEmpty()) {
            val current = pending.removeFirst()
            if (current.isDirectory) {
                current.listFiles().forEach(pending::addLast)
            } else if (current.isFile && isSupportedDocument(current.name)) {
                results += ScanItem(
                    uri = current.uri,
                    name = current.name ?: "Document",
                    mimeType = current.type ?: "application/octet-stream",
                    sizeBytes = current.length(),
                    category = ScanCategory.DOCUMENTS
                )
            }
        }
        return results
    }

    private fun isSupportedDocument(name: String?): Boolean {
        val extension = name?.substringAfterLast('.', "")?.lowercase() ?: return false
        return extension in setOf("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf")
    }

    private fun requireMediaPermission(category: ScanCategory) {
        val permission = when (category) {
            ScanCategory.PHOTOS -> if (Build.VERSION.SDK_INT >= 33) {
                android.Manifest.permission.READ_MEDIA_IMAGES
            } else {
                android.Manifest.permission.READ_EXTERNAL_STORAGE
            }
            ScanCategory.VIDEOS -> if (Build.VERSION.SDK_INT >= 33) {
                android.Manifest.permission.READ_MEDIA_VIDEO
            } else {
                android.Manifest.permission.READ_EXTERNAL_STORAGE
            }
            ScanCategory.AUDIO -> if (Build.VERSION.SDK_INT >= 33) {
                android.Manifest.permission.READ_MEDIA_AUDIO
            } else {
                android.Manifest.permission.READ_EXTERNAL_STORAGE
            }
            else -> error("Unsupported media category: $category")
        }
        val hasPermission = ContextCompat.checkSelfPermission(context, permission) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        val hasSelectedMediaAccess = Build.VERSION.SDK_INT >= 34 &&
            category in setOf(ScanCategory.PHOTOS, ScanCategory.VIDEOS) &&
            ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        check(hasPermission || hasSelectedMediaAccess) {
            "Permission to read ${category.label.lowercase()} was not granted."
        }
    }

    private fun checkPermission(permission: String) {
        check(
            ContextCompat.checkSelfPermission(context, permission) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            "Permission to read contacts was not granted."
        }
    }

    private fun escapeVCard(value: String): String =
        value.replace("\\", "\\\\").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")
}
