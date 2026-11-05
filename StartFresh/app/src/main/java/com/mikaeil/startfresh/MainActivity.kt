package com.mikaeil.startfresh

import android.Manifest
import android.app.TimePickerDialog
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.google.gson.Gson
import com.mikaeil.startfresh.data.*
import com.mikaeil.startfresh.notifications.ReminderScheduler
import com.mikaeil.startfresh.util.JalaliDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.LocalDate

private val Navy = Color(0xFF102A43)
private val Teal = Color(0xFF00A995)
private val Gold = Color(0xFFFFC857)
private val Muted = Color(0xFF718096)

enum class Page(val title: String, val icon: String) {
    HOME("خانه", "⌂"),
    STUDY("مطالعه", "✎"),
    HABITS("عادت‌ها", "✓"),
    BOOKS("کتابخانه", "▤"),
    MORE("بیشتر", "•••"),
    SAVINGS("پس‌انداز", "◈"),
    CALENDAR("تقویم", "▦"),
    REPORTS("گزارش‌ها", "▥"),
    JOURNAL("دفتر روزانه", "☷"),
    AWARDS("دستاوردها", "✧"),
    SETTINGS("تنظیمات", "⚙"),
    SEARCH("جست‌وجو", "⌕")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val database = StartFreshDatabase.get(applicationContext)
        val preferences = getSharedPreferences("start_fresh_settings", Context.MODE_PRIVATE)
        val dark = preferences.getBoolean("dark_theme", false)
        setContent {
            var darkTheme by rememberSaveable { mutableStateOf(dark) }
            StartFreshTheme(darkTheme) {
                StartFreshApp(
                    database = database,
                    darkTheme = darkTheme,
                    onDarkThemeChange = {
                        darkTheme = it
                        preferences.edit().putBoolean("dark_theme", it).apply()
                    }
                )
            }
        }
    }
}

@Composable
private fun StartFreshTheme(dark: Boolean, content: @Composable () -> Unit) {
    val scheme = if (dark) {
        darkColorScheme(
            primary = Color(0xFF53D8C5),
            secondary = Gold,
            background = Color(0xFF0D1B2A),
            surface = Color(0xFF14283B),
            onPrimary = Navy,
            onBackground = Color(0xFFEAF2F8),
            onSurface = Color(0xFFEAF2F8)
        )
    } else {
        lightColorScheme(
            primary = Teal,
            secondary = Gold,
            background = Color(0xFFF4F8FA),
            surface = Color.White,
            onPrimary = Color.White,
            onBackground = Navy,
            onSurface = Navy
        )
    }
    MaterialTheme(colorScheme = scheme, typography = Typography(), content = content)
}

@Composable
private fun StartFreshApp(
    database: StartFreshDatabase,
    darkTheme: Boolean,
    onDarkThemeChange: (Boolean) -> Unit
) {
    val dao = remember(database) { database.dao() }
    val subjects by remember(dao) { dao.observeSubjects() }.collectAsState(initial = emptyList())
    val sessions by remember(dao) { dao.observeSessions() }.collectAsState(initial = emptyList())
    val books by remember(dao) { dao.observeBooks() }.collectAsState(initial = emptyList())
    val bookLogs by remember(dao) { dao.observeBookLogs() }.collectAsState(initial = emptyList())
    val habits by remember(dao) { dao.observeHabits() }.collectAsState(initial = emptyList())
    val habitLogs by remember(dao) { dao.observeHabitLogs() }.collectAsState(initial = emptyList())
    val goals by remember(dao) { dao.observeSavingGoals() }.collectAsState(initial = emptyList())
    val moneyEntries by remember(dao) { dao.observeMoneyEntries() }.collectAsState(initial = emptyList())
    val journals by remember(dao) { dao.observeJournals() }.collectAsState(initial = emptyList())
    var page by rememberSaveable { mutableStateOf(Page.HOME) }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            bottomBar = {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    listOf(Page.HOME, Page.STUDY, Page.HABITS, Page.BOOKS, Page.MORE).forEach { item ->
                        NavigationBarItem(
                            selected = page == item || (page in listOf(Page.SAVINGS, Page.CALENDAR, Page.REPORTS, Page.JOURNAL, Page.AWARDS, Page.SETTINGS, Page.SEARCH) && item == Page.MORE),
                            onClick = { page = item },
                            icon = { Text(item.icon, fontSize = 19.sp) },
                            label = { Text(item.title, fontSize = 11.sp) },
                            alwaysShowLabel = true
                        )
                    }
                }
            }
        ) { insets ->
            Box(Modifier.fillMaxSize().padding(insets)) {
                when (page) {
                    Page.HOME -> HomeScreen(
                        sessions, books, bookLogs, habits, habitLogs, goals,
                        onStudy = { page = Page.STUDY },
                        onBooks = { page = Page.BOOKS },
                        onHabits = { page = Page.HABITS },
                        onSavings = { page = Page.SAVINGS }
                    )
                    Page.STUDY -> StudyScreen(dao, subjects, sessions)
                    Page.BOOKS -> BooksScreen(dao, books, bookLogs)
                    Page.HABITS -> HabitsScreen(dao, habits, habitLogs)
                    Page.SAVINGS -> SavingsScreen(dao, goals, moneyEntries)
                    Page.CALENDAR -> CalendarScreen(sessions, books, bookLogs, habits, habitLogs, moneyEntries, journals)
                    Page.REPORTS -> ReportsScreen(sessions, moneyEntries, bookLogs, habitLogs)
                    Page.JOURNAL -> JournalScreen(dao, journals)
                    Page.AWARDS -> AwardsScreen(sessions, bookLogs, habitLogs, books, goals)
                    Page.SEARCH -> SearchScreen(sessions, books, habits, moneyEntries, journals)
                    Page.SETTINGS -> SettingsScreen(
                        dao, subjects, sessions, books, bookLogs, habits, habitLogs,
                        goals, moneyEntries, journals, darkTheme, onDarkThemeChange
                    )
                    Page.MORE -> MoreScreen { page = it }
                }
            }
        }
    }
}

@Composable
private fun ScreenColumn(content: @Composable ColumnScope.() -> Unit) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        content = content
    )
}

@Composable
private fun ScreenHeader(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, fontSize = 23.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
        Text(subtitle, fontSize = 13.sp, color = Muted)
    }
}

@Composable
private fun SectionTitle(title: String, trailing: String = "") {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        if (trailing.isNotBlank()) Text(trailing, color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun SoftCard(
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.surface,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = color),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp), content = content)
    }
}

@Composable
private fun ProgressLine(value: Float, color: Color = Teal) {
    Box(
        Modifier.fillMaxWidth().height(9.dp).background(MaterialTheme.colorScheme.surfaceVariant, CircleShape)
    ) {
        Box(
            Modifier.fillMaxWidth(value.coerceIn(0f, 1f)).fillMaxHeight().background(color, CircleShape)
        )
    }
}

@Composable
private fun EmptyHint(text: String) {
    Text(text, color = Muted, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp))
}

@Composable
private fun ActionButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Button(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 11.dp)
    ) { Text(text, fontWeight = FontWeight.SemiBold) }
}

@Composable
private fun OutlineButton(text: String, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, shape = RoundedCornerShape(14.dp)) { Text(text) }
}

private fun parseInputInt(value: String): Int? = persianToLatin(value).toIntOrNull()
private fun parseInputLong(value: String): Long? = persianToLatin(value).toLongOrNull()
private fun persianToLatin(value: String): String {
    val persian = "۰۱۲۳۴۵۶۷۸۹"
    val arabic = "٠١٢٣٤٥٦٧٨٩"
    return value.map { ch ->
        val p = persian.indexOf(ch)
        val a = arabic.indexOf(ch)
        when {
            p >= 0 -> ('0'.code + p).toChar()
            a >= 0 -> ('0'.code + a).toChar()
            else -> ch
        }
    }.joinToString("")
}

private fun percent(value: Int, total: Int): Float =
    if (total <= 0) 0f else (value.toFloat() / total.toFloat()).coerceIn(0f, 1f)

private fun toman(value: Long): String =
    JalaliDate.toPersianDigits(String.format("%,d", value)) + " تومان"

private fun streakForHabit(habitId: Long, logs: List<HabitLog>, today: String): Int {
    val dates = logs.filter { it.habitId == habitId && it.completed }.map { it.date }.toSet()
    var cursor = if (today in dates) today else JalaliDate.shift(today, -1)
    var count = 0
    while (cursor in dates && count < 400) {
        count++
        cursor = JalaliDate.shift(cursor, -1)
    }
    return count
}

private fun overallStreak(logs: List<HabitLog>, today: String): Int {
    val dates = logs.filter { it.completed }.map { it.date }.toSet()
    var cursor = if (today in dates) today else JalaliDate.shift(today, -1)
    var count = 0
    while (cursor in dates && count < 400) {
        count++
        cursor = JalaliDate.shift(cursor, -1)
    }
    return count
}

@Composable
private fun MissionRow(title: String, done: Boolean) {
    SoftCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(if (done) "✅" else "◯", fontSize = 19.sp)
            Spacer(Modifier.width(10.dp))
            Text(title, Modifier.weight(1f), fontSize = 13.sp)
            Text(if (done) "انجام شد" else "در انتظار", fontSize = 11.sp, color = if (done) Teal else Muted)
        }
    }
}

@Composable
private fun MetricTile(title: String, value: String, detail: String, emoji: String, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier) {
        Text(emoji, fontSize = 22.sp)
        Text(value, fontWeight = FontWeight.Bold, fontSize = 19.sp)
        Text(title, fontSize = 12.sp, color = Muted)
        Text(detail, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
    }
}

@Composable
private fun HomeScreen(
    sessions: List<StudySession>,
    books: List<Book>,
    bookLogs: List<BookLog>,
    habits: List<Habit>,
    habitLogs: List<HabitLog>,
    goals: List<SavingGoal>,
    onStudy: () -> Unit,
    onBooks: () -> Unit,
    onHabits: () -> Unit,
    onSavings: () -> Unit
) {
    val today = JalaliDate.todayKey()
    val context = LocalContext.current
    val preferences = remember(context) { context.getSharedPreferences("start_fresh_settings", Context.MODE_PRIVATE) }
    val studyTarget = preferences.getInt("study_daily_target", 120)
    val todayMinutes = sessions.filter { it.date == today }.sumOf { it.minutes }
    val pagesToday = bookLogs.filter { it.date == today }.sumOf { it.pages }
    val completedToday = habitLogs.count { it.date == today && it.completed }
    val todayHabits = habits.size
    val totalSaved = goals.sumOf { it.savedAmount }
    val totalTarget = goals.sumOf { it.targetAmount }
    val progressParts = listOf(
        percent(todayMinutes, studyTarget),
        if (todayHabits == 0) 0f else percent(completedToday, todayHabits),
        if (books.isEmpty()) 0f else books.count { it.status == "DONE" }.toFloat() / books.size,
        percent(totalSaved.toInt(), totalTarget.coerceAtMost(Int.MAX_VALUE.toLong()).toInt())
    )
    val overall = if (progressParts.all { it == 0f }) 0 else (progressParts.average() * 100).toInt()
    val quotes = listOf(
        "قدم‌های کوچک، نتیجه‌های بزرگ می‌سازند.",
        "لازم نیست عالی شروع کنی؛ فقط شروع کن.",
        "پیشرفت آرام هم پیشرفت است.",
        "امروز فرصتی تازه برای بهتر شدن است.",
        "به خودت قول‌های کوچک بده و به آن‌ها وفادار بمان."
    )
    val quoteIndex = LocalDate.now().dayOfYear % quotes.size

    ScreenColumn {
        Text("سلام، به شروع تازه خوش اومدی 🌱", fontSize = 21.sp, fontWeight = FontWeight.Bold)
        Text(JalaliDate.format(today, true), color = Muted, fontSize = 13.sp)
        SoftCard(color = MaterialTheme.colorScheme.primaryContainer) {
            Text("جمله امروز", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            Text("«" + quotes[quoteIndex] + "»", fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
            Text("هر روز، یک قدم به نسخه بهتر خودت نزدیک‌تر شو.", color = Muted, fontSize = 12.sp)
        }
        SoftCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("پیشرفت امروز", fontWeight = FontWeight.Bold)
                Text(JalaliDate.number(overall) + "٪", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }
            ProgressLine(overall / 100f)
            Text("روزهای متوالی با ثبت عادت: " + JalaliDate.number(overallStreak(habitLogs, today)), color = Muted, fontSize = 12.sp)
        }
        SectionTitle("خلاصه امروز")
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricTile("مطالعه", JalaliDate.number(todayMinutes) + " دقیقه", "هدف روزانه " + JalaliDate.number(studyTarget) + " دقیقه", "📘", Modifier.weight(1f))
            MetricTile("کتاب‌خوانی", JalaliDate.number(pagesToday) + " صفحه", "صفحات ثبت‌شده امروز", "📚", Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricTile("عادت‌ها", JalaliDate.number(completedToday) + "/" + JalaliDate.number(todayHabits), "تکمیل‌شده امروز", "🌿", Modifier.weight(1f))
            MetricTile("پس‌انداز", toman(totalSaved), if (totalTarget > 0) "از " + toman(totalTarget) else "هدف مالی تعیین نشده", "💰", Modifier.weight(1f))
        }
        SectionTitle("ماموریت‌های امروز")
        MissionRow("۳۰ دقیقه مطالعه", todayMinutes >= 30)
        MissionRow("۱۰ صفحه کتاب‌خوانی", pagesToday >= 10)
        MissionRow("ثبت حداقل یک عادت", completedToday > 0)
        SectionTitle("شروع سریع")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("شروع مطالعه", onStudy, Modifier.weight(1f))
            OutlineButton("ثبت عادت", onHabits)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlineButton("ثبت کتاب", onBooks)
            OutlineButton("هدف پس‌انداز", onSavings)
        }
    }
}

@Composable
private fun StudyScreen(dao: StartFreshDao, subjects: List<StudySubject>, sessions: List<StudySession>) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val preferences = remember { context.getSharedPreferences("start_fresh_settings", Context.MODE_PRIVATE) }
    val today = JalaliDate.todayKey()
    val todayMinutes = sessions.filter { it.date == today }.sumOf { it.minutes }
    var dailyTarget by rememberSaveable { mutableIntStateOf(preferences.getInt("study_daily_target", 120)) }
    var showTargetDialog by remember { mutableStateOf(false) }
    var running by rememberSaveable { mutableStateOf(false) }
    var seconds by rememberSaveable { mutableIntStateOf(0) }
    var pomodoroMode by rememberSaveable { mutableStateOf(false) }
    var pomodoroRemaining by rememberSaveable { mutableIntStateOf(25 * 60) }
    var showManual by remember { mutableStateOf(false) }
    var timerSubject by rememberSaveable { mutableStateOf("مطالعه آزاد") }

    LaunchedEffect(running, pomodoroMode) {
        while (running) {
            delay(1000)
            if (pomodoroMode) {
                if (pomodoroRemaining <= 1) {
                    running = false
                    val subject = subjects.firstOrNull { it.name == timerSubject }
                        ?: StudySubject(name = timerSubject)
                    scope.launch {
                        val id = if (subject.id == 0L) dao.insertSubject(subject) else subject.id
                        dao.insertSession(StudySession(subjectId = id, subjectName = timerSubject, date = today, minutes = 25))
                    }
                    pomodoroRemaining = 25 * 60
                    seconds = 0
                } else {
                    pomodoroRemaining--
                }
            } else {
                seconds++
            }
        }
    }

    ScreenColumn {
        ScreenHeader("مدیریت مطالعه", JalaliDate.format(today, true))
        SoftCard(color = MaterialTheme.colorScheme.primaryContainer) {
            Text("تایمر تمرکز", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = !pomodoroMode, onClick = { running = false; pomodoroMode = false; seconds = 0 }, label = { Text("تایمر آزاد") })
                FilterChip(selected = pomodoroMode, onClick = { running = false; pomodoroMode = true; pomodoroRemaining = 25 * 60 }, label = { Text("پومودورو ۲۵ دقیقه") })
            }
            OutlinedTextField(timerSubject, { timerSubject = it }, label = { Text("درس یا موضوع") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            val shown = if (pomodoroMode) pomodoroRemaining else seconds
            Text(
                String.format("%02d:%02d:%02d", shown / 3600, (shown % 3600) / 60, shown % 60)
                    .let { JalaliDate.toPersianDigits(it) },
                fontSize = 34.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ActionButton(if (running) "مکث" else if (seconds > 0) "ادامه" else "شروع", {
                    running = !running
                }, Modifier.weight(1f))
                OutlineButton("پایان و ثبت") {
                    running = false
                    val elapsed = if (pomodoroMode) (25 * 60 - pomodoroRemaining) else seconds
                    if (elapsed > 0) {
                        val minutes = (elapsed / 60).coerceAtLeast(1)
                        scope.launch {
                            val subject = subjects.firstOrNull { it.name == timerSubject }
                                ?: StudySubject(name = timerSubject)
                            val id = if (subject.id == 0L) dao.insertSubject(subject) else subject.id
                            dao.insertSession(StudySession(subjectId = id, subjectName = timerSubject, date = today, minutes = minutes))
                        }
                    }
                    seconds = 0
                    pomodoroRemaining = 25 * 60
                }
            }
            Text(if (pomodoroMode) "با پایان ۲۵ دقیقه، جلسه به‌صورت خودکار ثبت می‌شود." else "برای ثبت زمان دقیق، پس از پایان جلسه آن را ذخیره کن.", color = Muted, fontSize = 11.sp)
        }
        SoftCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("مطالعه امروز", color = Muted, fontSize = 12.sp)
                    Text(JalaliDate.number(todayMinutes) + " دقیقه", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("هدف روزانه", color = Muted, fontSize = 12.sp)
                    Text(JalaliDate.number(dailyTarget) + " دقیقه", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                }
            }
            ProgressLine(percent(todayMinutes, dailyTarget))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("هدف هفتگی: " + JalaliDate.number(dailyTarget * 7) + " دقیقه", color = Muted, fontSize = 11.sp)
                TextButton(onClick = { showTargetDialog = true }) { Text("تغییر هدف") }
            }
            Text("هدف ماهانه پیشنهادی: " + JalaliDate.number(dailyTarget * 30) + " دقیقه", color = Muted, fontSize = 11.sp)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("جلسه‌های اخیر", Modifier.weight(1f), fontWeight = FontWeight.Bold, fontSize = 16.sp)
            ActionButton("ثبت دستی", { showManual = true })
        }
        if (sessions.isEmpty()) EmptyHint("هنوز جلسه‌ای ثبت نشده. اولین جلسه‌ات را شروع کن.")
        sessions.take(20).forEach { session ->
            SoftCard {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(session.subjectName, fontWeight = FontWeight.Bold)
                    Text(JalaliDate.number(session.minutes) + " دقیقه", color = MaterialTheme.colorScheme.primary)
                }
                Text(JalaliDate.format(session.date), color = Muted, fontSize = 11.sp)
                if (session.note.isNotBlank()) Text(session.note, fontSize = 12.sp)
                TextButton(onClick = { scope.launch { dao.deleteSession(session.id) } }) { Text("حذف جلسه", color = Color(0xFFCC5A56)) }
            }
        }
    }

    if (showTargetDialog) {
        StudyTargetDialog(dailyTarget, onDismiss = { showTargetDialog = false }) { next ->
            dailyTarget = next
            preferences.edit().putInt("study_daily_target", next).apply()
            showTargetDialog = false
        }
    }
    if (showManual) {
        StudyEntryDialog(subjects, onDismiss = { showManual = false }) { name, minutes, note ->
            scope.launch {
                val existing = subjects.firstOrNull { it.name.equals(name, true) }
                val id = existing?.id ?: dao.insertSubject(StudySubject(name = name))
                dao.insertSession(StudySession(subjectId = id, subjectName = name, date = today, minutes = minutes, note = note))
            }
            showManual = false
        }
    }
}

@Composable
private fun StudyTargetDialog(current: Int, onDismiss: () -> Unit, onSave: (Int) -> Unit) {
    var value by remember { mutableStateOf(current.toString()) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("هدف روزانه مطالعه") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value, { value = it.filter(Char::isDigit) }, label = { Text("دقیقه در روز") }, singleLine = true)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(120, 180, 240).forEach { minutes ->
                        FilterChip(selected = value == minutes.toString(), onClick = { value = minutes.toString() }, label = { Text(JalaliDate.number(minutes / 60) + " ساعت") })
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = { parseInputInt(value)?.takeIf { it in 15..1440 }?.let(onSave) }) { Text("ذخیره") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun StudyEntryDialog(
    subjects: List<StudySubject>,
    onDismiss: () -> Unit,
    onSave: (String, Int, String) -> Unit
) {
    var name by remember { mutableStateOf(subjects.firstOrNull()?.name ?: "") }
    var minutes by remember { mutableStateOf("۳۰") }
    var note by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("ثبت جلسه مطالعه") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(name, { name = it }, label = { Text("نام درس یا موضوع") }, singleLine = true)
                OutlinedTextField(minutes, { minutes = it.filter { c -> c.isDigit() } }, label = { Text("مدت به دقیقه") }, singleLine = true)
                OutlinedTextField(note, { note = it }, label = { Text("یادداشت جلسه") }, minLines = 2)
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val value = parseInputInt(minutes)
                if (name.isNotBlank() && value != null && value > 0) onSave(name.trim(), value, note.trim())
            }) { Text("ذخیره") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun BooksScreen(dao: StartFreshDao, books: List<Book>, logs: List<BookLog>) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val preferences = remember(context) { context.getSharedPreferences("start_fresh_settings", Context.MODE_PRIVATE) }
    val today = JalaliDate.todayKey()
    val pagesToday = logs.filter { it.date == today }.sumOf { it.pages }
    var pageGoal by rememberSaveable { mutableIntStateOf(preferences.getInt("book_daily_target", 10)) }
    var showPageGoal by remember { mutableStateOf(false) }
    var showAddBook by remember { mutableStateOf(false) }
    var bookToEdit by remember { mutableStateOf<Book?>(null) }
    var bookToDelete by remember { mutableStateOf<Book?>(null) }
    var selectedBook by remember { mutableStateOf<Book?>(null) }

    fun saveBook(existing: Book?, title: String, author: String, totalPages: Int, category: String) {
        val duplicate = books.any {
            it.id != (existing?.id ?: 0L) && it.title.trim().equals(title.trim(), ignoreCase = true)
        }
        if (duplicate) {
            Toast.makeText(context, "این کتاب قبلاً به کتابخانه اضافه شده است.", Toast.LENGTH_SHORT).show()
            return
        }
        if (existing != null && totalPages < existing.pagesRead) {
            Toast.makeText(context, "تعداد کل صفحات نمی‌تواند کمتر از صفحات خوانده‌شده باشد.", Toast.LENGTH_LONG).show()
            return
        }
        scope.launch {
            if (existing == null) {
                dao.insertBook(Book(title = title.trim(), author = author.trim(), totalPages = totalPages, category = category.trim()))
                Toast.makeText(context, "کتاب به کتابخانه اضافه شد.", Toast.LENGTH_SHORT).show()
            } else {
                val nextStatus = when {
                    existing.pagesRead >= totalPages -> "DONE"
                    existing.pagesRead > 0 -> "READING"
                    else -> existing.status
                }
                dao.updateBook(existing.copy(
                    title = title.trim(),
                    author = author.trim(),
                    totalPages = totalPages,
                    category = category.trim(),
                    status = nextStatus
                ))
                Toast.makeText(context, "مشخصات کتاب به‌روزرسانی شد.", Toast.LENGTH_SHORT).show()
            }
        }
        showAddBook = false
        bookToEdit = null
    }

    ScreenColumn {
        ScreenHeader("کتابخانه من", "کتاب‌هایت را ثبت کن و پیشرفت خواندنشان را دنبال کن")

        // Primary action is deliberately full-width and placed before the statistics card.
        Button(
            onClick = { showAddBook = true },
            modifier = Modifier.fillMaxWidth().heightIn(min = 58.dp),
            shape = RoundedCornerShape(18.dp)
        ) {
            Text("＋  افزودن کتاب جدید", fontSize = 17.sp, fontWeight = FontWeight.Bold)
        }

        SoftCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("کتاب‌های کامل‌شده", color = Muted, fontSize = 12.sp)
                    Text(JalaliDate.number(books.count { it.status == "DONE" }), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("مجموع صفحات خوانده‌شده", color = Muted, fontSize = 12.sp)
                    Text(JalaliDate.number(logs.sumOf { it.pages }), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                }
            }
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("هدف امروز: " + JalaliDate.number(pageGoal) + " صفحه", fontSize = 12.sp, color = Muted)
                TextButton(onClick = { showPageGoal = true }) { Text("تغییر هدف") }
            }
            ProgressLine(percent(pagesToday, pageGoal), Gold)
            Text("امروز " + JalaliDate.number(pagesToday) + " صفحه خوانده‌ای.", fontSize = 11.sp, color = Muted)
        }

        SectionTitle("کتاب‌های من", JalaliDate.number(books.size) + " عنوان")
        if (books.isEmpty()) {
            SoftCard(color = MaterialTheme.colorScheme.primaryContainer) {
                Text("هنوز کتابی در کتابخانه‌ات نیست.", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("با دکمه «افزودن کتاب جدید» اولین کتابت را ثبت کن.", color = Muted, fontSize = 13.sp)
                Button(
                    onClick = { showAddBook = true },
                    modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("＋  ثبت اولین کتاب", fontWeight = FontWeight.Bold)
                }
            }
        }

        books.forEach { book ->
            SoftCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(54.dp).background(Color(0xFFE3F4F1), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("📖", fontSize = 26.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(book.title, fontWeight = FontWeight.Bold)
                        Text(book.author.ifBlank { "نویسنده ثبت نشده" }, color = Muted, fontSize = 12.sp)
                        if (book.category.isNotBlank()) Text(book.category, color = Muted, fontSize = 11.sp)
                    }
                    Text(
                        JalaliDate.number((percent(book.pagesRead, book.totalPages) * 100).toInt()) + "٪",
                        color = Teal,
                        fontWeight = FontWeight.Bold
                    )
                }
                ProgressLine(percent(book.pagesRead, book.totalPages), Gold)
                Text(
                    JalaliDate.number(book.pagesRead) + " از " + JalaliDate.number(book.totalPages) + " صفحه",
                    color = Muted,
                    fontSize = 12.sp
                )
                Button(
                    onClick = { selectedBook = book },
                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(if (book.status == "DONE") "ثبت مطالعه بیشتر" else "ثبت صفحات مطالعه‌شده")
                }
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { bookToEdit = book },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("✎  ویرایش")
                    }
                    OutlinedButton(
                        onClick = { bookToDelete = book },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFCC5A56))
                    ) {
                        Text("حذف کتاب")
                    }
                }
            }
        }
    }

    if (showPageGoal) {
        PageGoalDialog(pageGoal, onDismiss = { showPageGoal = false }) { next ->
            pageGoal = next
            preferences.edit().putInt("book_daily_target", next).apply()
            showPageGoal = false
        }
    }
    if (showAddBook) {
        BookEditorDialog(
            initialBook = null,
            onDismiss = { showAddBook = false },
            onSave = { title, author, pages, category -> saveBook(null, title, author, pages, category) }
        )
    }
    bookToEdit?.let { book ->
        BookEditorDialog(
            initialBook = book,
            onDismiss = { bookToEdit = null },
            onSave = { title, author, pages, category -> saveBook(book, title, author, pages, category) }
        )
    }
    bookToDelete?.let { book ->
        AlertDialog(
            onDismissRequest = { bookToDelete = null },
            title = { Text("حذف کتاب؟") },
            text = {
                Text("«${book.title}» و سوابق صفحات خوانده‌شده آن حذف می‌شود. این کار قابل بازگشت نیست.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        scope.launch {
                            dao.deleteBookLogsForBook(book.id)
                            dao.deleteBook(book.id)
                            Toast.makeText(context, "کتاب و سوابقش حذف شد.", Toast.LENGTH_SHORT).show()
                        }
                        bookToDelete = null
                    }
                ) {
                    Text("بله، حذف شود", color = Color(0xFFCC5A56))
                }
            },
            dismissButton = { TextButton(onClick = { bookToDelete = null }) { Text("انصراف") } }
        )
    }
    selectedBook?.let { book ->
        ReadPagesDialog(book, onDismiss = { selectedBook = null }) { pages, note ->
            scope.launch {
                val next = (book.pagesRead + pages).coerceAtMost(book.totalPages)
                val actualPages = (next - book.pagesRead).coerceAtLeast(0)
                if (actualPages > 0) {
                    dao.updateBook(book.copy(
                        pagesRead = next,
                        status = if (next >= book.totalPages) "DONE" else "READING"
                    ))
                    val day = JalaliDate.todayKey()
                    val previous = dao.findBookLog(book.id, day)
                    if (previous == null) {
                        dao.insertBookLog(BookLog(bookId = book.id, date = day, pages = actualPages, note = note.trim()))
                    } else {
                        dao.insertBookLog(previous.copy(
                            pages = previous.pages + actualPages,
                            note = note.trim().ifBlank { previous.note }
                        ))
                    }
                    Toast.makeText(context, "مطالعه ثبت شد.", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "صفحه باقی‌مانده‌ای برای ثبت وجود ندارد.", Toast.LENGTH_SHORT).show()
                }
            }
            selectedBook = null
        }
    }
}

@Composable
private fun PageGoalDialog(current: Int, onDismiss: () -> Unit, onSave: (Int) -> Unit) {
    var value by remember { mutableStateOf(current.toString()) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("هدف روزانه کتاب‌خوانی") },
        text = { OutlinedTextField(value, { value = it.filter(Char::isDigit) }, label = { Text("تعداد صفحه در روز") }, singleLine = true) },
        confirmButton = { TextButton(onClick = { parseInputInt(value)?.takeIf { it in 1..500 }?.let(onSave) }) { Text("ذخیره") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun BookEditorDialog(
    initialBook: Book?,
    onDismiss: () -> Unit,
    onSave: (String, String, Int, String) -> Unit
) {
    var title by remember(initialBook?.id) { mutableStateOf(initialBook?.title.orEmpty()) }
    var author by remember(initialBook?.id) { mutableStateOf(initialBook?.author.orEmpty()) }
    var pages by remember(initialBook?.id) { mutableStateOf(initialBook?.totalPages?.toString().orEmpty()) }
    var category by remember(initialBook?.id) { mutableStateOf(initialBook?.category.orEmpty()) }
    val parsedPages = parseInputInt(pages)
    val minimumPages = initialBook?.pagesRead ?: 1
    val isValid = title.isNotBlank() && parsedPages != null && parsedPages >= minimumPages && parsedPages > 0

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initialBook == null) "افزودن کتاب جدید" else "ویرایش مشخصات کتاب") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("نام کتاب") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = author,
                    onValueChange = { author = it },
                    label = { Text("نویسنده") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = pages,
                    onValueChange = { pages = it.filter(Char::isDigit) },
                    label = { Text("تعداد کل صفحات") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                if (initialBook != null && initialBook.pagesRead > 0) {
                    Text(
                        "تا الان ${JalaliDate.number(initialBook.pagesRead)} صفحه خوانده‌ای؛ تعداد کل نمی‌تواند کمتر باشد.",
                        color = Muted,
                        fontSize = 11.sp
                    )
                }
                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    label = { Text("دسته‌بندی (اختیاری)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = isValid,
                onClick = {
                    onSave(title.trim(), author.trim(), parsedPages ?: 1, category.trim())
                }
            ) {
                Text(if (initialBook == null) "افزودن کتاب" else "ذخیره تغییرات")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun ReadPagesDialog(book: Book, onDismiss: () -> Unit, onSave: (Int, String) -> Unit) {
    var pages by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("ثبت مطالعه · " + book.title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("صفحات باقی‌مانده: " + JalaliDate.number((book.totalPages - book.pagesRead).coerceAtLeast(0)))
                OutlinedTextField(pages, { pages = it.filter(Char::isDigit) }, label = { Text("چند صفحه خواندی؟") }, singleLine = true)
                OutlinedTextField(note, { note = it }, label = { Text("یادداشت کوتاه") })
            }
        },
        confirmButton = { TextButton(onClick = { val n = parseInputInt(pages); if (n != null && n > 0) onSave(n, note) }) { Text("ثبت") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun HabitsScreen(dao: StartFreshDao, habits: List<Habit>, logs: List<HabitLog>) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val today = JalaliDate.todayKey()
    var showAddDialog by remember { mutableStateOf(false) }
    var habitToEdit by remember { mutableStateOf<Habit?>(null) }
    var habitToDelete by remember { mutableStateOf<Habit?>(null) }

    fun saveHabit(existing: Habit?, name: String, icon: String, target: Int, unit: String) {
        val duplicate = habits.any {
            it.id != (existing?.id ?: 0L) && it.name.trim().equals(name.trim(), ignoreCase = true)
        }
        if (duplicate) {
            Toast.makeText(context, "این عادت قبلاً ثبت شده است.", Toast.LENGTH_SHORT).show()
            return
        }
        scope.launch {
            val value = if (existing == null) {
                Habit(name = name.trim(), icon = icon, weeklyTarget = target, unit = unit.trim())
            } else {
                existing.copy(name = name.trim(), icon = icon, weeklyTarget = target, unit = unit.trim())
            }
            if (existing == null) dao.insertHabit(value) else dao.updateHabit(value)
            Toast.makeText(context, if (existing == null) "عادت جدید اضافه شد." else "عادت ویرایش شد.", Toast.LENGTH_SHORT).show()
        }
        showAddDialog = false
        habitToEdit = null
    }

    ScreenColumn {
        ScreenHeader("عادت‌های من", "تداوم از کمال مهم‌تر است")
        SoftCard(color = MaterialTheme.colorScheme.primaryContainer) {
            Text("عادت‌هایت را اینجا بساز و هر روز انجام‌شدنشان را ثبت کن.", fontWeight = FontWeight.SemiBold)
            Text("می‌توانی نام، نماد و هدف هفتگی هر عادت را هر زمان ویرایش کنی.", color = Muted, fontSize = 12.sp)
            Button(
                onClick = { showAddDialog = true },
                modifier = Modifier.fillMaxWidth().heightIn(min = 54.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("＋  افزودن عادت جدید", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }

        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("فهرست عادت‌ها", Modifier.weight(1f), fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Text(JalaliDate.number(habits.size) + " عادت", color = Muted, fontSize = 12.sp)
        }

        if (habits.isEmpty()) {
            SoftCard {
                EmptyHint("هنوز عادتی نساخته‌ای. با دکمه بالا اولین عادتت را اضافه کن.")
                OutlinedButton(
                    onClick = { showAddDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("ساخت اولین عادت")
                }
            }
        }

        habits.forEach { habit ->
            val log = logs.firstOrNull { it.habitId == habit.id && it.date == today }
            val done = log?.completed == true
            val weekStart = JalaliDate.shift(today, -6)
            val weekCount = logs.count {
                it.habitId == habit.id && it.completed && it.date >= weekStart && it.date <= today
            }
            SoftCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(48.dp).background(Color(0xFFE4F5F1), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(habit.icon, fontSize = 24.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(habit.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            "هدف هفتگی: " + JalaliDate.number(habit.weeklyTarget) + " " + habit.unit,
                            color = Muted,
                            fontSize = 12.sp
                        )
                    }
                    Text(
                        JalaliDate.number(streakForHabit(habit.id, logs, today)) + " روز",
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
                Button(
                    onClick = {
                        scope.launch {
                            val existing = dao.findHabitLog(habit.id, today)
                            if (existing == null) {
                                dao.insertHabitLog(HabitLog(habitId = habit.id, date = today, completed = true))
                            } else {
                                dao.insertHabitLog(existing.copy(completed = !existing.completed))
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (done) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(
                        if (done) "✓ امروز انجام شد · برای لغو لمس کن" else "ثبت انجام امروز",
                        color = if (done) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        "استمرار: " + JalaliDate.number(streakForHabit(habit.id, logs, today)) + " روز",
                        color = Muted,
                        fontSize = 12.sp
                    )
                    Text(
                        JalaliDate.number(weekCount) + " از " + JalaliDate.number(habit.weeklyTarget) + " این هفته",
                        color = Muted,
                        fontSize = 12.sp
                    )
                }
                ProgressLine(percent(weekCount, habit.weeklyTarget), Gold)
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { habitToEdit = habit },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("✎  ویرایش")
                    }
                    OutlinedButton(
                        onClick = { habitToDelete = habit },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFCC5A56))
                    ) {
                        Text("حذف عادت")
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        HabitEditorDialog(
            initialHabit = null,
            onDismiss = { showAddDialog = false },
            onSave = { name, icon, target, unit -> saveHabit(null, name, icon, target, unit) }
        )
    }
    habitToEdit?.let { habit ->
        HabitEditorDialog(
            initialHabit = habit,
            onDismiss = { habitToEdit = null },
            onSave = { name, icon, target, unit -> saveHabit(habit, name, icon, target, unit) }
        )
    }
    habitToDelete?.let { habit ->
        AlertDialog(
            onDismissRequest = { habitToDelete = null },
            title = { Text("حذف عادت؟") },
            text = {
                Text("«${habit.name}» و تمام سوابق انجام روزانه آن حذف می‌شود. این کار قابل بازگشت نیست.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        scope.launch {
                            dao.deleteHabitLogsForHabit(habit.id)
                            dao.deleteHabit(habit.id)
                            Toast.makeText(context, "عادت حذف شد.", Toast.LENGTH_SHORT).show()
                        }
                        habitToDelete = null
                    }
                ) {
                    Text("حذف عادت", color = Color(0xFFCC5A56))
                }
            },
            dismissButton = {
                TextButton(onClick = { habitToDelete = null }) { Text("انصراف") }
            }
        )
    }
}

@Composable
private fun HabitEditorDialog(
    initialHabit: Habit?,
    onDismiss: () -> Unit,
    onSave: (String, String, Int, String) -> Unit
) {
    var name by remember(initialHabit?.id) { mutableStateOf(initialHabit?.name.orEmpty()) }
    var icon by remember(initialHabit?.id) { mutableStateOf(initialHabit?.icon ?: "🌱") }
    var target by remember(initialHabit?.id) { mutableStateOf((initialHabit?.weeklyTarget ?: 7).toString()) }
    var unit by remember(initialHabit?.id) { mutableStateOf(initialHabit?.unit ?: "بار") }
    val parsedTarget = parseInputInt(target)
    val canSave = name.isNotBlank() && parsedTarget != null && parsedTarget in 1..7 && unit.isNotBlank()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initialHabit == null) "ساخت عادت تازه" else "ویرایش عادت") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("نام عادت") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = icon,
                    onValueChange = { icon = it.take(4) },
                    label = { Text("ایموجی یا نماد") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = target,
                    onValueChange = { target = it.filter(Char::isDigit) },
                    label = { Text("هدف در هفته (۱ تا ۷)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = unit,
                    onValueChange = { unit = it },
                    label = { Text("واحد هدف؛ مثل بار یا جلسه") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = canSave,
                onClick = {
                    onSave(
                        name.trim(),
                        icon.ifBlank { "✦" },
                        parsedTarget ?: 7,
                        unit.trim()
                    )
                }
            ) {
                Text(if (initialHabit == null) "افزودن عادت" else "ذخیره تغییرات")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun SavingsScreen(dao: StartFreshDao, goals: List<SavingGoal>, entries: List<MoneyEntry>) {
    val scope = rememberCoroutineScope()
    var addGoal by remember { mutableStateOf(false) }
    var selectedGoal by remember { mutableStateOf<SavingGoal?>(null) }
    var withdrawGoal by remember { mutableStateOf<SavingGoal?>(null) }
    var addMoney by remember { mutableStateOf(false) }
    val thisMonth = JalaliDate.todayKey().take(7)
    val income = entries.filter { it.type == "income" && it.date.startsWith(thisMonth) }.sumOf { it.amount }
    val expense = entries.filter { it.type == "expense" && it.date.startsWith(thisMonth) }.sumOf { it.amount }
    ScreenColumn {
        ScreenHeader("مدیریت پول", "قدم‌های کوچک برای هدف‌های مالی")
        SoftCard {
            Text("خلاصه این ماه", fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Column(Modifier.weight(1f)) { Text("درآمد", color = Muted, fontSize = 11.sp); Text(toman(income), color = Teal, fontWeight = FontWeight.Bold) }
                Column(Modifier.weight(1f)) { Text("هزینه", color = Muted, fontSize = 11.sp); Text(toman(expense), color = Color(0xFFCC5A56), fontWeight = FontWeight.Bold) }
            }
            Text("ثبت‌ها کاملاً دستی هستند و به حساب بانکی متصل نیستند.", color = Muted, fontSize = 11.sp)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("هدف جدید", { addGoal = true }, Modifier.weight(1f))
            OutlineButton("ثبت درآمد/هزینه", { addMoney = true })
        }
        SectionTitle("هدف‌های پس‌انداز")
        if (goals.isEmpty()) EmptyHint("برای پولت یک هدف روشن تعریف کن.")
        goals.forEach { goal ->
            SoftCard {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(goal.title, fontWeight = FontWeight.Bold)
                    Text(JalaliDate.number((percent(goal.savedAmount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(), goal.targetAmount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt()) * 100).toInt()) + "٪", color = Teal, fontWeight = FontWeight.Bold)
                }
                ProgressLine(percent(goal.savedAmount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(), goal.targetAmount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt()), Gold)
                Text(toman(goal.savedAmount) + " از " + toman(goal.targetAmount), color = Muted, fontSize = 12.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ActionButton("واریز", { selectedGoal = goal }, Modifier.weight(1f))
                    OutlineButton("برداشت") { withdrawGoal = goal }
                }
            }
        }
        SectionTitle("آخرین تراکنش‌ها")
        if (entries.isEmpty()) EmptyHint("هنوز درآمد یا هزینه‌ای ثبت نشده.")
        entries.take(15).forEach { entry ->
            Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(entry.title, fontWeight = FontWeight.Medium)
                    Text(JalaliDate.format(entry.date), color = Muted, fontSize = 11.sp)
                }
                Text((if (entry.type == "expense") "− " else "+ ") + toman(entry.amount), color = if (entry.type == "expense") Color(0xFFCC5A56) else Teal, fontWeight = FontWeight.SemiBold)
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
        }
    }
    if (addGoal) AddGoalDialog({ addGoal = false }) { title, amount ->
        scope.launch { dao.insertSavingGoal(SavingGoal(title = title, targetAmount = amount)) }
        addGoal = false
    }
    selectedGoal?.let { goal ->
        ContributionDialog(goal, { selectedGoal = null }) { amount ->
            scope.launch {
                dao.updateSavingGoal(goal.copy(savedAmount = goal.savedAmount + amount))
                dao.insertMoneyEntry(MoneyEntry(title = "پس‌انداز: " + goal.title, amount = amount, type = "saving", category = "پس‌انداز", date = JalaliDate.todayKey()))
            }
            selectedGoal = null
        }
    }
    withdrawGoal?.let { goal ->
        WithdrawDialog(goal, { withdrawGoal = null }) { amount ->
            scope.launch {
                dao.updateSavingGoal(goal.copy(savedAmount = (goal.savedAmount - amount).coerceAtLeast(0)))
                dao.insertMoneyEntry(MoneyEntry(title = "برداشت از: " + goal.title, amount = amount, type = "expense", category = "برداشت پس‌انداز", date = JalaliDate.todayKey()))
            }
            withdrawGoal = null
        }
    }
    if (addMoney) MoneyEntryDialog({ addMoney = false }) { title, amount, type, category ->
        scope.launch { dao.insertMoneyEntry(MoneyEntry(title = title, amount = amount, type = type, category = category, date = JalaliDate.todayKey())) }
        addMoney = false
    }
}

@Composable
private fun AddGoalDialog(onDismiss: () -> Unit, onSave: (String, Long) -> Unit) {
    var title by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("هدف مالی جدید") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(title, { title = it }, label = { Text("عنوان هدف") }, singleLine = true)
                OutlinedTextField(amount, { amount = it.filter(Char::isDigit) }, label = { Text("مبلغ هدف به تومان") }, singleLine = true)
            }
        },
        confirmButton = { TextButton(onClick = { val n = parseInputLong(amount); if (title.isNotBlank() && n != null && n > 0) onSave(title.trim(), n) }) { Text("ثبت هدف") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun ContributionDialog(goal: SavingGoal, onDismiss: () -> Unit, onSave: (Long) -> Unit) {
    var amount by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("واریز به " + goal.title) },
        text = { OutlinedTextField(amount, { amount = it.filter(Char::isDigit) }, label = { Text("مبلغ به تومان") }, singleLine = true) },
        confirmButton = { TextButton(onClick = { parseInputLong(amount)?.takeIf { it > 0 }?.let(onSave) }) { Text("ثبت واریز") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun WithdrawDialog(goal: SavingGoal, onDismiss: () -> Unit, onSave: (Long) -> Unit) {
    var amount by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("برداشت از " + goal.title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("موجودی فعلی: " + toman(goal.savedAmount), color = Muted, fontSize = 12.sp)
                OutlinedTextField(amount, { amount = it.filter(Char::isDigit) }, label = { Text("مبلغ برداشت به تومان") }, singleLine = true)
            }
        },
        confirmButton = {
            TextButton(onClick = {
                parseInputLong(amount)?.takeIf { it > 0 && it <= goal.savedAmount }?.let(onSave)
            }) { Text("ثبت برداشت") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun MoneyEntryDialog(onDismiss: () -> Unit, onSave: (String, Long, String, String) -> Unit) {
    var title by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("expense") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("ثبت تراکنش دستی") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = type == "income", onClick = { type = "income" }, label = { Text("درآمد") })
                    FilterChip(selected = type == "expense", onClick = { type = "expense" }, label = { Text("هزینه") })
                }
                OutlinedTextField(title, { title = it }, label = { Text("عنوان") }, singleLine = true)
                OutlinedTextField(amount, { amount = it.filter(Char::isDigit) }, label = { Text("مبلغ به تومان") }, singleLine = true)
                OutlinedTextField(category, { category = it }, label = { Text("دسته‌بندی") }, singleLine = true)
            }
        },
        confirmButton = { TextButton(onClick = { val n = parseInputLong(amount); if (title.isNotBlank() && n != null && n > 0) onSave(title.trim(), n, type, category.trim()) }) { Text("ذخیره") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("لغو") } }
    )
}

@Composable
private fun CalendarScreen(
    sessions: List<StudySession>,
    books: List<Book>,
    bookLogs: List<BookLog>,
    habits: List<Habit>,
    habitLogs: List<HabitLog>,
    moneyEntries: List<MoneyEntry>,
    journals: List<DailyJournal>
) {
    var selectedDate by rememberSaveable { mutableStateOf(JalaliDate.todayKey()) }
    val daySessions = sessions.filter { it.date == selectedDate }
    val dayPages = bookLogs.filter { it.date == selectedDate }.sumOf { it.pages }
    val dayHabits = habitLogs.filter { it.date == selectedDate && it.completed }
    val daySaving = moneyEntries.filter { it.date == selectedDate && it.category == "پس‌انداز" }.sumOf { it.amount } -
        moneyEntries.filter { it.date == selectedDate && it.category == "برداشت پس‌انداز" }.sumOf { it.amount }
    val journal = journals.firstOrNull { it.date == selectedDate }
    ScreenColumn {
        ScreenHeader("تقویم پیشرفت", "روزهایت را با مهربانی مرور کن")
        SoftCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = { selectedDate = JalaliDate.shift(selectedDate, -1) }) { Text("روز قبل") }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(JalaliDate.format(selectedDate), fontWeight = FontWeight.Bold)
                    if (selectedDate == JalaliDate.todayKey()) Text("امروز", color = Teal, fontSize = 11.sp)
                }
                TextButton(onClick = { selectedDate = JalaliDate.shift(selectedDate, 1) }) { Text("روز بعد") }
            }
        }
        MetricTile("مدت مطالعه", JalaliDate.number(daySessions.sumOf { it.minutes }) + " دقیقه", "در این روز", "📘")
        MetricTile("کتاب‌خوانی", JalaliDate.number(dayPages) + " صفحه", "صفحات ثبت‌شده", "📚")
        MetricTile("عادت‌های انجام‌شده", JalaliDate.number(dayHabits.size) + " از " + JalaliDate.number(habits.size), "ثبت‌های روز", "🌱")
        SoftCard {
            Text("ثبت‌های مطالعه", fontWeight = FontWeight.Bold)
            if (daySessions.isEmpty()) EmptyHint("جلسه‌ای برای این روز نیست.")
            daySessions.forEach { Text("• " + it.subjectName + " · " + JalaliDate.number(it.minutes) + " دقیقه") }
        }
        SoftCard {
            Text("دفتر روزانه", fontWeight = FontWeight.Bold)
            Text(journal?.highlight?.ifBlank { "بدون یادداشت" } ?: "یادداشتی برای این روز ثبت نشده", color = Muted, fontSize = 13.sp)
        }
        Text("خالص واریزی پس‌انداز در این روز: " + toman(daySaving), color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun ReportsScreen(
    sessions: List<StudySession>,
    entries: List<MoneyEntry>,
    bookLogs: List<BookLog>,
    habitLogs: List<HabitLog>
) {
    val today = JalaliDate.todayKey()
    val days = (6 downTo 0).map { JalaliDate.shift(today, -it.toLong()) }
    val daily = days.map { date -> sessions.filter { it.date == date }.sumOf { it.minutes } }
    val totalWeek = daily.sum()
    val lastWeekStart = JalaliDate.shift(today, -13)
    val lastWeekEnd = JalaliDate.shift(today, -7)
    val previous = sessions.filter { it.date >= lastWeekStart && it.date <= lastWeekEnd }.sumOf { it.minutes }
    val bestIndex = daily.indices.maxByOrNull { daily[it] } ?: 0
    val month = today.take(7)
    val income = entries.filter { it.type == "income" && it.date.startsWith(month) }.sumOf { it.amount }
    val expense = entries.filter { it.type == "expense" && it.date.startsWith(month) }.sumOf { it.amount }
    ScreenColumn {
        ScreenHeader("گزارش‌های من", "آمار واقعی بر اساس ثبت‌های تو")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MetricTile("مطالعه هفته", JalaliDate.number(totalWeek) + " دقیقه", "۷ روز اخیر", "⏱", Modifier.weight(1f))
            MetricTile("میانگین روزانه", JalaliDate.number(totalWeek / 7) + " دقیقه", "در هفته اخیر", "📈", Modifier.weight(1f))
        }
        SoftCard {
            SectionTitle("نمودار مطالعه هفتگی")
            WeeklyChart(daily)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("۷ روز پیش", color = Muted, fontSize = 10.sp)
                Text("امروز", color = Muted, fontSize = 10.sp)
            }
        }
        SoftCard {
            Text("بهترین روز", fontWeight = FontWeight.Bold)
            Text(JalaliDate.format(days[bestIndex]) + " · " + JalaliDate.number(daily[bestIndex]) + " دقیقه", color = Teal)
            Text("مقایسه با هفته قبل: " + if (totalWeek >= previous) "افزایش " + JalaliDate.number(totalWeek - previous) + " دقیقه" else "کاهش " + JalaliDate.number(previous - totalWeek) + " دقیقه", color = Muted, fontSize = 12.sp)
        }
        SoftCard {
            Text("خلاصه مالی ماه", fontWeight = FontWeight.Bold)
            Text("درآمد: " + toman(income), color = Teal)
            Text("هزینه: " + toman(expense), color = Color(0xFFCC5A56))
            Text("خالص: " + toman(income - expense), fontWeight = FontWeight.Bold)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MetricTile("صفحات کتاب", JalaliDate.number(bookLogs.filter { it.date >= lastWeekEnd && it.date <= today }.sumOf { it.pages }), "هفته جاری", "📚", Modifier.weight(1f))
            MetricTile("عادت‌های موفق", JalaliDate.number(habitLogs.count { it.completed && it.date >= lastWeekEnd && it.date <= today }), "هفته جاری", "🌿", Modifier.weight(1f))
        }
    }
}

@Composable
private fun WeeklyChart(values: List<Int>) {
    Canvas(Modifier.fillMaxWidth().height(150.dp).padding(vertical = 8.dp)) {
        val maxValue = (values.maxOrNull() ?: 0).coerceAtLeast(1).toFloat()
        val left = 12.dp.toPx()
        val right = size.width - 12.dp.toPx()
        val top = 12.dp.toPx()
        val bottom = size.height - 12.dp.toPx()
        val points = values.mapIndexed { index, value ->
            val x = left + (right - left) * index / (values.size - 1).coerceAtLeast(1)
            val y = bottom - (bottom - top) * value / maxValue
            androidx.compose.ui.geometry.Offset(x, y)
        }
        val path = Path()
        points.forEachIndexed { index, point ->
            if (index == 0) path.moveTo(point.x, point.y) else path.lineTo(point.x, point.y)
        }
        drawPath(path, color = Teal, style = Stroke(width = 3.dp.toPx()))
        points.forEach { drawCircle(Teal, radius = 4.dp.toPx(), center = it) }
    }
}

@Composable
private fun JournalScreen(dao: StartFreshDao, journals: List<DailyJournal>) {
    val scope = rememberCoroutineScope()
    val today = JalaliDate.todayKey()
    val saved = journals.firstOrNull { it.date == today }
    var mood by remember(saved) { mutableStateOf(saved?.mood ?: "🙂") }
    var highlight by remember(saved) { mutableStateOf(saved?.highlight ?: "") }
    var improvement by remember(saved) { mutableStateOf(saved?.improvement ?: "") }
    var goals by remember(saved) { mutableStateOf(saved?.tomorrowGoals ?: "") }
    var note by remember(saved) { mutableStateOf(saved?.note ?: "") }
    ScreenColumn {
        ScreenHeader("دفتر روزانه من", JalaliDate.format(today, true))
        SoftCard {
            Text("حال و هوای امروزت چطوره؟", fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("😄", "🙂", "😐", "😔", "😴").forEach { emoji ->
                    Box(
                        Modifier.size(44.dp).background(if (mood == emoji) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant, CircleShape).clickable { mood = emoji },
                        contentAlignment = Alignment.Center
                    ) { Text(emoji, fontSize = 22.sp) }
                }
            }
        }
        JournalField("مهم‌ترین اتفاق امروز", highlight, { highlight = it })
        JournalField("امروز چه چیزی را می‌توانم بهتر کنم؟", improvement, { improvement = it })
        JournalField("سه هدف مهم فردا", goals, { goals = it }, lines = 3)
        JournalField("یادداشت آزاد", note, { note = it }, lines = 4)
        ActionButton("ذخیره مرور امروز", {
            scope.launch {
                dao.insertJournal(DailyJournal(date = today, mood = mood, highlight = highlight, improvement = improvement, tomorrowGoals = goals, note = note))
            }
        }, Modifier.fillMaxWidth())
        SectionTitle("روزهای قبلی")
        journals.filter { it.date != today }.take(12).forEach { item ->
            SoftCard {
                Text(JalaliDate.format(item.date), fontWeight = FontWeight.Bold)
                Text(item.mood + "  " + item.highlight.ifBlank { "بدون عنوان" }, color = Muted, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun JournalField(label: String, value: String, onChange: (String) -> Unit, lines: Int = 2) {
    SoftCard {
        Text(label, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        OutlinedTextField(value, onChange, modifier = Modifier.fillMaxWidth(), minLines = lines, placeholder = { Text("اینجا بنویس…") })
    }
}

@Composable
private fun AwardsScreen(
    sessions: List<StudySession>,
    bookLogs: List<BookLog>,
    habitLogs: List<HabitLog>,
    books: List<Book>,
    goals: List<SavingGoal>
) {
    val studyXp = sessions.sumOf { (it.minutes / 30) * 10 }
    val readXp = bookLogs.sumOf { (it.pages / 15) * 5 }
    val habitXp = habitLogs.count { it.completed } * 5
    val xp = studyXp + readXp + habitXp
    val level = 1 + xp / 100
    val levelProgress = (xp % 100) / 100f
    val badges = listOf(
        Triple("شروع قدرتمند", "اولین جلسه مطالعه", sessions.isNotEmpty()),
        Triple("هفت روز استمرار", "ثبت فعالیت در ۷ روز متوالی", overallStreak(habitLogs, JalaliDate.todayKey()) >= 7),
        Triple("اولین کتاب", "تکمیل یک کتاب", books.any { it.status == "DONE" }),
        Triple("۱۰۰ ساعت مطالعه", "رسیدن به ۶۰۰۰ دقیقه مطالعه", sessions.sumOf { it.minutes } >= 6000),
        Triple("اولین پس‌انداز", "ثبت اولین هدف مالی و واریز", goals.any { it.savedAmount > 0 }),
        Triple("نظم شخصی", "ثبت ۳۰ عادت موفق", habitLogs.count { it.completed } >= 30)
    )
    ScreenColumn {
        ScreenHeader("دستاوردها", "پیشرفت واقعی تو، امتیاز واقعی تو")
        SoftCard(color = MaterialTheme.colorScheme.primaryContainer) {
            Text("سطح " + JalaliDate.number(level), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Text(JalaliDate.number(xp) + " امتیاز تجربه (XP)", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            ProgressLine(levelProgress, Gold)
            Text(JalaliDate.number(xp % 100) + " از ۱۰۰ امتیاز تا سطح بعدی", fontSize = 11.sp, color = Muted)
        }
        SectionTitle("نشان‌های افتخار")
        badges.forEach { badge ->
            SoftCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(if (badge.third) "🏅" else "🔒", fontSize = 24.sp)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(badge.first, fontWeight = FontWeight.Bold)
                        Text(badge.second, fontSize = 11.sp, color = Muted)
                    }
                    Text(if (badge.third) "دریافت شد" else "در انتظار", fontSize = 10.sp, color = if (badge.third) Teal else Muted)
                }
            }
        }
        Text("امتیاز مطالعه هر ۳۰ دقیقه ۱۰ XP، هر ۱۵ صفحه ۵ XP و هر عادت تکمیل‌شده ۵ XP است. ثبت تکراری یک عادت در یک روز امتیاز دوباره نمی‌دهد.", color = Muted, fontSize = 11.sp)
    }
}

@Composable
private fun MoreScreen(onNavigate: (Page) -> Unit) {
    ScreenColumn {
        ScreenHeader("بخش‌های بیشتر", "همه ابزارهای مسیر رشدت")
        listOf(
            Triple(Page.SAVINGS, "مدیریت پول و پس‌انداز", "💰"),
            Triple(Page.CALENDAR, "تقویم شمسی و مرور روزها", "🗓️"),
            Triple(Page.REPORTS, "نمودارها و گزارش‌ها", "📊"),
            Triple(Page.JOURNAL, "دفتر روزانه من", "📝"),
            Triple(Page.AWARDS, "امتیازها و دستاوردها", "🏅"),
            Triple(Page.SETTINGS, "تنظیمات و پشتیبان‌گیری", "⚙️"),
            Triple(Page.SEARCH, "جست‌وجوی اطلاعات ثبت‌شده", "🔎")
        ).forEach { item ->
            SoftCard(Modifier.clickable { onNavigate(item.first) }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(item.third, fontSize = 26.sp)
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) { Text(item.second, fontWeight = FontWeight.Bold) }
                    Text("‹", color = Muted, fontSize = 22.sp)
                }
            }
        }
    }
}

@Composable
private fun SearchScreen(
    sessions: List<StudySession>,
    books: List<Book>,
    habits: List<Habit>,
    entries: List<MoneyEntry>,
    journals: List<DailyJournal>
) {
    var query by rememberSaveable { mutableStateOf("") }
    val q = query.trim()
    val results = buildList {
        sessions.filter { q.isNotBlank() && (it.subjectName.contains(q, true) || it.note.contains(q, true)) }
            .forEach { add("مطالعه · " + it.subjectName + " · " + JalaliDate.short(it.date) + " · " + JalaliDate.number(it.minutes) + " دقیقه") }
        books.filter { q.isNotBlank() && (it.title.contains(q, true) || it.author.contains(q, true) || it.category.contains(q, true)) }
            .forEach { add("کتاب · " + it.title + " · " + it.author) }
        habits.filter { q.isNotBlank() && it.name.contains(q, true) }
            .forEach { add("عادت · " + it.name) }
        entries.filter { q.isNotBlank() && (it.title.contains(q, true) || it.category.contains(q, true)) }
            .forEach { add("تراکنش · " + it.title + " · " + toman(it.amount)) }
        journals.filter { q.isNotBlank() && (it.highlight.contains(q, true) || it.note.contains(q, true) || it.improvement.contains(q, true)) }
            .forEach { add("دفتر روزانه · " + JalaliDate.short(it.date) + " · " + it.highlight) }
    }
    ScreenColumn {
        ScreenHeader("جست‌وجو", "در داده‌های ذخیره‌شده خودت")
        OutlinedTextField(
            query, { query = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("نام کتاب، درس، عادت یا عبارت…") },
            singleLine = true
        )
        if (q.isBlank()) EmptyHint("برای شروع، یک واژه وارد کن.")
        else if (results.isEmpty()) EmptyHint("نتیجه‌ای پیدا نشد.")
        else {
            SectionTitle("نتایج", JalaliDate.number(results.size) + " مورد")
            results.forEach { result ->
                SoftCard { Text(result, fontSize = 13.sp) }
            }
        }
    }
}

@Composable
private fun SettingsScreen(
    dao: StartFreshDao,
    subjects: List<StudySubject>,
    sessions: List<StudySession>,
    books: List<Book>,
    bookLogs: List<BookLog>,
    habits: List<Habit>,
    habitLogs: List<HabitLog>,
    goals: List<SavingGoal>,
    moneyEntries: List<MoneyEntry>,
    journals: List<DailyJournal>,
    darkTheme: Boolean,
    onDarkThemeChange: (Boolean) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val prefs = remember { context.getSharedPreferences("start_fresh_settings", Context.MODE_PRIVATE) }
    var reminders by remember { mutableStateOf(prefs.getBoolean("reminders_enabled", false)) }
    var reminderHour by remember { mutableIntStateOf(prefs.getInt("reminder_hour", 20)) }
    var reminderMinute by remember { mutableIntStateOf(prefs.getInt("reminder_minute", 0)) }
    var confirmRestore by remember { mutableStateOf<BackupData?>(null) }
    var confirmDelete by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            prefs.edit().putBoolean("reminders_enabled", true).apply()
            reminders = true
            ReminderScheduler.schedule(context, true)
        } else {
            Toast.makeText(context, "برای نمایش اعلان باید مجوز را فعال کنی.", Toast.LENGTH_LONG).show()
            reminders = false
        }
    }
    val backupLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri != null) {
            val data = BackupData(subjects, sessions, books, bookLogs, habits, habitLogs, goals, moneyEntries, journals)
            runCatching {
                context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(Gson().toJson(data)) }
            }.onSuccess { Toast.makeText(context, "پشتیبان ذخیره شد.", Toast.LENGTH_SHORT).show() }
                .onFailure { Toast.makeText(context, "ذخیره پشتیبان ناموفق بود.", Toast.LENGTH_LONG).show() }
        }
    }
    val restoreLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            runCatching {
                val raw = context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                    ?: error("فایل قابل خواندن نیست")
                Gson().fromJson(raw, BackupData::class.java) ?: error("ساختار پشتیبان معتبر نیست")
            }.onSuccess { confirmRestore = it }
                .onFailure { Toast.makeText(context, "فایل پشتیبان معتبر نیست.", Toast.LENGTH_LONG).show() }
        }
    }
    val csvLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { uri ->
        if (uri != null) {
            val csv = buildString {
                append("نوع,عنوان,مبلغ/مدت,تاریخ\n")
                sessions.forEach { append("مطالعه,").append(it.subjectName).append(',').append(it.minutes).append(',').append(JalaliDate.short(it.date)).append('\n') }
                moneyEntries.forEach { append(it.type).append(',').append(it.title).append(',').append(it.amount).append(',').append(JalaliDate.short(it.date)).append('\n') }
                bookLogs.forEach { append("کتاب‌خوانی,").append(it.bookId).append(',').append(it.pages).append(',').append(JalaliDate.short(it.date)).append('\n') }
            }
            runCatching { context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(csv) } }
                .onSuccess { Toast.makeText(context, "گزارش CSV ذخیره شد.", Toast.LENGTH_SHORT).show() }
                .onFailure { Toast.makeText(context, "ساخت گزارش ناموفق بود.", Toast.LENGTH_LONG).show() }
        }
    }

    ScreenColumn {
        ScreenHeader("تنظیمات", "برنامه را مطابق سلیقه‌ات تنظیم کن")
        SoftCard {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Column(Modifier.weight(1f)) {
                    Text("حالت تاریک", fontWeight = FontWeight.Bold)
                    Text("نمایش آرام‌تر در محیط کم‌نور", color = Muted, fontSize = 11.sp)
                }
                Switch(checked = darkTheme, onCheckedChange = onDarkThemeChange)
            }
        }
        SoftCard {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Column(Modifier.weight(1f)) {
                    Text("یادآوری روزانه", fontWeight = FontWeight.Bold)
                    Text("یک پیام کوتاه برای مرور برنامه", color = Muted, fontSize = 11.sp)
                }
                Switch(checked = reminders, onCheckedChange = { enabled ->
                    if (enabled && Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        reminders = enabled
                        prefs.edit().putBoolean("reminders_enabled", enabled).apply()
                        ReminderScheduler.schedule(context, enabled)
                    }
                })
            }
            OutlinedButton(onClick = {
                TimePickerDialog(context, { _, hour, minute ->
                    reminderHour = hour; reminderMinute = minute
                    prefs.edit().putInt("reminder_hour", hour).putInt("reminder_minute", minute).apply()
                    if (reminders) ReminderScheduler.schedule(context, true)
                }, reminderHour, reminderMinute, true).show()
            }) { Text("ساعت یادآوری: " + JalaliDate.toPersianDigits(String.format("%02d:%02d", reminderHour, reminderMinute))) }
        }
        SoftCard {
            Text("پشتیبان‌گیری و انتقال اطلاعات", fontWeight = FontWeight.Bold)
            Text("فایل JSON شامل اطلاعات ذخیره‌شده را می‌توانی نگه داری و بعداً بازیابی کنی.", color = Muted, fontSize = 12.sp)
            ActionButton("خروجی پشتیبان JSON", { backupLauncher.launch("start-fresh-backup.json") }, Modifier.fillMaxWidth())
            OutlineButton("بازیابی از فایل JSON") { restoreLauncher.launch(arrayOf("application/json", "text/*")) }
            OutlineButton("خروجی گزارش CSV") { csvLauncher.launch("start-fresh-report.csv") }
        }
        SoftCard {
            Text("مدیریت اطلاعات", fontWeight = FontWeight.Bold)
            Text("حذف همه اطلاعات برگشت‌پذیر نیست. پیش از آن، پشتیبان بگیر.", color = Muted, fontSize = 12.sp)
            Button(onClick = { confirmDelete = true }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB94A48))) { Text("حذف همه اطلاعات") }
        }
        SoftCard {
            Text("شروع تازه · نسخه ۱٫۰", fontWeight = FontWeight.Bold)
            Text("اطلاعات به‌صورت محلی روی همین دستگاه ذخیره می‌شوند. برای استفاده روزمره نیازی به اینترنت یا حساب کاربری نیست.", color = Muted, fontSize = 12.sp)
            Text("هر روز، یک قدم به نسخه بهتر خودت نزدیک‌تر شو.", color = Teal, fontSize = 12.sp)
        }
    }

    confirmRestore?.let { backup ->
        AlertDialog(
            onDismissRequest = { confirmRestore = null },
            title = { Text("بازیابی پشتیبان؟") },
            text = { Text("اطلاعات فعلی با اطلاعات فایل پشتیبان جایگزین می‌شود. پیش از ادامه از اطلاعات فعلی نسخه پشتیبان بگیر.") },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch(Dispatchers.IO) { dao.replaceAll(backup) }
                    confirmRestore = null
                    Toast.makeText(context, "بازیابی اطلاعات آغاز شد.", Toast.LENGTH_SHORT).show()
                }) { Text("بازیابی") }
            },
            dismissButton = { TextButton(onClick = { confirmRestore = null }) { Text("انصراف") } }
        )
    }
    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("همه اطلاعات حذف شود؟") },
            text = { Text("تمام مطالعه‌ها، کتاب‌ها، عادت‌ها، تراکنش‌ها و یادداشت‌ها پاک می‌شوند.") },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch(Dispatchers.IO) { dao.replaceAll(BackupData()) }
                    confirmDelete = false
                    Toast.makeText(context, "اطلاعات برنامه پاک شد.", Toast.LENGTH_SHORT).show()
                }) { Text("حذف همه", color = Color(0xFFCC5A56)) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("لغو") } }
        )
    }
}
