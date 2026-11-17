package com.recoverx.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import java.io.IOException
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AudioFile
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.recoverx.app.data.ScanCategory
import com.recoverx.app.data.ScanItem
import com.recoverx.app.data.ScanRepository
import kotlinx.coroutines.launch

private val Navy = Color(0xFF071426)
private val Panel = Color(0xFF10243B)
private val Muted = Color(0xFF8DA2B9)
private val Cyan = Color(0xFF5DE0D1)

@Composable
fun RecoverXApp() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val repository = remember { ScanRepository(context.applicationContext) }
    val snackbars = remember { SnackbarHostState() }
    val results = remember { mutableStateListOf<ScanItem>() }
    var pendingCategories by remember { mutableStateOf<List<ScanCategory>>(emptyList()) }
    var pendingExport by remember { mutableStateOf<ScanItem?>(null) }
    var documentTree by remember { mutableStateOf<Uri?>(null) }
    var scanning by remember { mutableStateOf(false) }
    var showResults by remember { mutableStateOf(false) }
    var showRealityNote by remember { mutableStateOf(false) }

    fun runScan(categories: List<ScanCategory>, tree: Uri? = documentTree) {
        scanning = true
        showResults = true
        scope.launch {
            try {
                val found = repository.scan(categories, tree)
                results.clear()
                results.addAll(found)
                if (found.isEmpty()) {
                    snackbars.showSnackbar("No accessible files found in this scan.")
                }
            } catch (error: SecurityException) {
                snackbars.showSnackbar(error.message ?: "Required access was not granted.")
            } catch (error: IllegalStateException) {
                snackbars.showSnackbar(error.message ?: "The scan could not be completed.")
            } finally {
                scanning = false
            }
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        val granted = pendingCategories.filter { category ->
            when (category) {
                ScanCategory.PHOTOS -> hasPermission(context, mediaPermission(ScanCategory.PHOTOS)) ||
                    (Build.VERSION.SDK_INT >= 34 && hasPermission(context, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED))
                ScanCategory.VIDEOS -> hasPermission(context, mediaPermission(ScanCategory.VIDEOS)) ||
                    (Build.VERSION.SDK_INT >= 34 && hasPermission(context, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED))
                ScanCategory.AUDIO -> hasPermission(context, mediaPermission(ScanCategory.AUDIO))
                ScanCategory.CONTACTS -> hasPermission(context, Manifest.permission.READ_CONTACTS)
                ScanCategory.DOCUMENTS -> true
            }
        }
        val deniedCount = pendingCategories.size - granted.size
        if (granted.isNotEmpty()) runScan(granted)
        if (deniedCount > 0) scope.launch {
            snackbars.showSnackbar("Some permissions were declined; only approved categories were scanned.")
        }
        pendingCategories = emptyList()
    }

    val folderPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocumentTree()
    ) { treeUri ->
        if (treeUri != null) {
            try {
                context.contentResolver.takePersistableUriPermission(
                    treeUri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
                documentTree = treeUri
                runScan(listOf(ScanCategory.DOCUMENTS), treeUri)
            } catch (error: SecurityException) {
                scope.launch {
                    snackbars.showSnackbar(error.message ?: "Access to the selected folder was denied.")
                }
            } catch (error: IllegalArgumentException) {
                scope.launch {
                    snackbars.showSnackbar("Android did not grant persistent access to that folder.")
                }
            }
        }
    }

    val exportLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/octet-stream")
    ) { destination ->
        val source = pendingExport
        if (destination != null && source != null) {
            scope.launch {
                try {
                    context.contentResolver.openOutputStream(destination)?.use { output ->
                        val vCard = source.contactVCard
                        if (vCard != null) {
                            output.write(vCard.toByteArray(Charsets.UTF_8))
                        } else {
                            val input = context.contentResolver.openInputStream(source.uri)
                                ?: error("Could not read the selected item.")
                            input.use { it.copyTo(output) }
                        }
                    } ?: error("Could not open the selected destination.")
                    snackbars.showSnackbar("Saved ${source.name} to the selected location.")
                } catch (error: IOException) {
                    snackbars.showSnackbar("Could not save ${source.name}: ${error.localizedMessage ?: "I/O error"}")
                } catch (error: SecurityException) {
                    snackbars.showSnackbar("Access to ${source.name} was denied.")
                } catch (error: IllegalStateException) {
                    snackbars.showSnackbar("Could not save ${source.name}: ${error.localizedMessage ?: "unknown error"}")
                } finally {
                    pendingExport = null
                }
            }
        } else {
            pendingExport = null
        }
    }

    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Cyan,
            onPrimary = Navy,
            background = Navy,
            surface = Panel,
            onSurface = Color.White,
            onBackground = Color.White,
            secondary = Color(0xFF99B5FF)
        )
    ) {
        Scaffold(
            containerColor = Navy,
            contentWindowInsets = WindowInsets.statusBars.union(WindowInsets.navigationBars),
            snackbarHost = { SnackbarHost(snackbars) }
        ) { padding ->
            if (showResults) {
                ResultsScreen(
                    items = results,
                    loading = scanning,
                    onBack = { showResults = false },
                    onPreview = { item -> openPreview(context, item, scope, snackbars) },
                    onExport = { item ->
                        pendingExport = item
                        exportLauncher.launch(item.name)
                    },
                    modifier = Modifier.padding(padding)
                )
            } else {
                HomeScreen(
                    loading = scanning,
                    onScan = { categories ->
                        pendingCategories = categories
                        val permissions = permissionsFor(categories)
                        val missing = permissions.filterNot { hasPermission(context, it) }
                        if (missing.isEmpty()) {
                            runScan(categories)
                        } else {
                            permissionLauncher.launch(missing.toTypedArray())
                        }
                    },
                    onChooseDocuments = { folderPicker.launch(null) },
                    onShowNote = { showRealityNote = true },
                    onOpenResults = { showResults = true },
                    resultCount = results.size,
                    modifier = Modifier.padding(padding)
                )
            }
        }
    }

    if (showRealityNote) {
        AlertDialog(
            onDismissRequest = { showRealityNote = false },
            containerColor = Panel,
            title = { Text("What RecoverX can scan") },
            text = {
                Text(
                    "This first version lists media and contacts you can currently access, plus documents in a folder you choose. It does not claim to resurrect permanently deleted files. Android encryption, TRIM, and app permissions often make those files unrecoverable without an existing backup or trash folder."
                )
            },
            confirmButton = {
                Button(onClick = { showRealityNote = false }) { Text("Got it") }
            }
        )
    }
}

@Composable
private fun HomeScreen(
    loading: Boolean,
    onScan: (List<ScanCategory>) -> Unit,
    onChooseDocuments: () -> Unit,
    onShowNote: () -> Unit,
    onOpenResults: () -> Unit,
    resultCount: Int,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(
            start = 20.dp,
            top = 14.dp,
            end = 20.dp,
            bottom = 28.dp
        ),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(15.dp))
                        .background(Cyan.copy(alpha = 0.13f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.Restore, null, tint = Cyan, modifier = Modifier.size(25.dp))
                }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    Text("RecoverX", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("MOBILE DATA RECOVERY", style = MaterialTheme.typography.labelSmall, color = Muted)
                }
                IconButton(onClick = onShowNote) {
                    Icon(Icons.Filled.Settings, contentDescription = "Recovery information", tint = Muted)
                }
            }
        }
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(26.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .background(
                            Brush.linearGradient(listOf(Color(0xFF12385C), Color(0xFF10243B), Color(0xFF113744)))
                        )
                        .padding(22.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("Your files,\nworth finding.", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "Scan accessible storage and backed-up folders.",
                                color = Color(0xFFC1D1DF),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        Icon(Icons.Filled.Bolt, null, tint = Cyan, modifier = Modifier.size(42.dp))
                    }
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick = {
                            onScan(listOf(ScanCategory.PHOTOS, ScanCategory.VIDEOS, ScanCategory.AUDIO))
                        },
                        enabled = !loading,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Cyan, contentColor = Navy)
                    ) {
                        if (loading) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Navy, strokeWidth = 2.dp)
                            Spacer(Modifier.width(10.dp))
                        } else {
                            Icon(Icons.Filled.Search, contentDescription = null)
                            Spacer(Modifier.width(9.dp))
                        }
                        Text(if (loading) "Scanning..." else "Scan accessible media", fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(Modifier.height(10.dp))
                    Text(
                        "Scans items Android currently allows this app to read.",
                        color = Color(0xFFB7C7D7),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Choose a scan", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                if (resultCount > 0) {
                    Text(
                        "$resultCount found",
                        color = Cyan,
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.clickable(onClick = onOpenResults)
                    )
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    CategoryCard(ScanCategory.PHOTOS, Icons.Filled.Image, Color(0xFF77A8FF), Modifier.weight(1f)) {
                        onScan(listOf(ScanCategory.PHOTOS))
                    }
                    CategoryCard(ScanCategory.VIDEOS, Icons.Filled.VideoLibrary, Color(0xFFFF9A76), Modifier.weight(1f)) {
                        onScan(listOf(ScanCategory.VIDEOS))
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    CategoryCard(ScanCategory.CONTACTS, Icons.Filled.People, Color(0xFFB597FF), Modifier.weight(1f)) {
                        onScan(listOf(ScanCategory.CONTACTS))
                    }
                    CategoryCard(ScanCategory.DOCUMENTS, Icons.Filled.Description, Color(0xFFFFC46B), Modifier.weight(1f)) {
                        onChooseDocuments()
                    }
                }
                CategoryCard(ScanCategory.AUDIO, Icons.Filled.AudioFile, Color(0xFF62D7C6), Modifier.fillMaxWidth()) {
                    onScan(listOf(ScanCategory.AUDIO))
                }
            }
        }
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Panel),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth().clickable(onClick = onShowNote)
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Security, null, tint = Cyan)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Private by design", fontWeight = FontWeight.SemiBold)
                        Text("Scans run on your device. Learn what recovery can do.", color = Muted, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
        item {
            Text(
                "DEEP SCAN means a detailed index of folders you grant access to — not raw disk recovery.",
                color = Muted,
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}

@Composable
private fun CategoryCard(
    category: ScanCategory,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.height(112.dp).clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Panel),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(Modifier.fillMaxSize().padding(15.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Box(
                Modifier.size(37.dp).clip(RoundedCornerShape(12.dp)).background(tint.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(21.dp))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(category.label, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                Icon(Icons.Filled.PlayArrow, null, tint = Muted, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun ResultsScreen(
    items: List<ScanItem>,
    loading: Boolean,
    onBack: () -> Unit,
    onPreview: (ScanItem) -> Unit,
    onExport: (ScanItem) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Back") }
            Column(Modifier.weight(1f)) {
                Text("Scan results", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("${items.size} accessible items", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
            if (loading) CircularProgressIndicator(Modifier.size(24.dp), color = Cyan, strokeWidth = 2.dp)
        }
        Text(
            "These are files or contacts you can currently access, not guaranteed deleted items.",
            color = Muted,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
        )
        if (!loading && items.isEmpty()) {
            Column(
                Modifier.fillMaxSize().padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Filled.FolderOpen, null, tint = Muted, modifier = Modifier.size(46.dp))
                Spacer(Modifier.height(12.dp))
                Text("Nothing found in this scan", fontWeight = FontWeight.SemiBold)
                Text("Try another category or choose a folder with backups.", color = Muted)
            }
        } else {
            LazyColumn(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 16.dp, end = 16.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(items, key = { "${it.category}:${it.uri}" }) { item ->
                    ResultRow(item, onPreview, onExport)
                }
            }
        }
    }
}

@Composable
private fun ResultRow(item: ScanItem, onPreview: (ScanItem) -> Unit, onExport: (ScanItem) -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Panel),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            Modifier.padding(start = 14.dp, top = 12.dp, end = 8.dp, bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier.size(42.dp).clip(CircleShape).background(Cyan.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(iconFor(item.category), null, tint = Cyan)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(item.name, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold)
                Text("${item.category.label} · ${formatSize(item.sizeBytes)}", color = Muted, style = MaterialTheme.typography.bodySmall)
            }
            IconButton(onClick = { onPreview(item) }) {
                Icon(Icons.Filled.CheckCircle, contentDescription = "Preview ${item.name}", tint = Muted)
            }
            IconButton(onClick = { onExport(item) }) {
                Icon(Icons.Filled.Restore, contentDescription = "Save a copy of ${item.name}", tint = Cyan)
            }
        }
    }
}

private fun iconFor(category: ScanCategory): ImageVector = when (category) {
    ScanCategory.PHOTOS -> Icons.Filled.Image
    ScanCategory.VIDEOS -> Icons.Filled.VideoLibrary
    ScanCategory.CONTACTS -> Icons.Filled.People
    ScanCategory.DOCUMENTS -> Icons.Filled.Description
    ScanCategory.AUDIO -> Icons.Filled.AudioFile
}

private fun formatSize(bytes: Long): String = when {
    bytes <= 0 -> "Contact"
    bytes < 1024 -> "$bytes B"
    bytes < 1024 * 1024 -> "${bytes / 1024} KB"
    else -> String.format("%.1f MB", bytes / (1024f * 1024f))
}

private fun mediaPermission(category: ScanCategory): String = when {
    Build.VERSION.SDK_INT < 33 -> Manifest.permission.READ_EXTERNAL_STORAGE
    category == ScanCategory.PHOTOS -> Manifest.permission.READ_MEDIA_IMAGES
    category == ScanCategory.VIDEOS -> Manifest.permission.READ_MEDIA_VIDEO
    else -> Manifest.permission.READ_MEDIA_AUDIO
}

private fun permissionsFor(categories: List<ScanCategory>): List<String> = categories.flatMap { category ->
    when (category) {
        ScanCategory.PHOTOS -> listOf(mediaPermission(category)) +
            if (Build.VERSION.SDK_INT >= 34) listOf(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) else emptyList()
        ScanCategory.VIDEOS -> listOf(mediaPermission(category)) +
            if (Build.VERSION.SDK_INT >= 34) listOf(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) else emptyList()
        ScanCategory.AUDIO -> listOf(mediaPermission(category))
        ScanCategory.CONTACTS -> listOf(Manifest.permission.READ_CONTACTS)
        ScanCategory.DOCUMENTS -> emptyList()
    }
}.distinct()

private fun hasPermission(context: android.content.Context, permission: String): Boolean =
    ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

private fun openPreview(
    context: android.content.Context,
    item: ScanItem,
    scope: kotlinx.coroutines.CoroutineScope,
    snackbars: SnackbarHostState
) {
    val intent = Intent(Intent.ACTION_VIEW).apply {
        if (item.category == ScanCategory.CONTACTS) {
            data = item.uri
        } else {
            setDataAndType(item.uri, item.mimeType)
        }
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    try {
        context.startActivity(intent)
    } catch (_: android.content.ActivityNotFoundException) {
        scope.launch { snackbars.showSnackbar("No app is available to preview this item.") }
    }
}
