package com.mikaeil.startfresh.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Index
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Transaction
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "subjects")
data class StudySubject(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val weeklyTargetMinutes: Int = 0
)

@Entity(tableName = "study_sessions")
data class StudySession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val subjectId: Long = 0,
    val subjectName: String,
    val date: String,
    val minutes: Int,
    val note: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "books")
data class Book(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val author: String = "",
    val totalPages: Int,
    val pagesRead: Int = 0,
    val status: String = "WANT",
    val category: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "book_logs", indices = [Index(value = ["bookId", "date"], unique = true)])
data class BookLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val bookId: Long,
    val date: String,
    val pages: Int,
    val note: String = ""
)

@Entity(tableName = "habits")
data class Habit(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val icon: String = "✦",
    val color: String = "00BFA6",
    val weeklyTarget: Int = 7,
    val unit: String = "بار",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "habit_logs",
    indices = [Index(value = ["habitId", "date"], unique = true)]
)
data class HabitLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val habitId: Long,
    val date: String,
    val completed: Boolean = true,
    val amount: Int = 1
)

@Entity(tableName = "saving_goals")
data class SavingGoal(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val targetAmount: Long,
    val savedAmount: Long = 0,
    val deadline: String = ""
)

@Entity(tableName = "money_entries")
data class MoneyEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val amount: Long,
    val type: String,
    val category: String = "",
    val date: String,
    val note: String = ""
)

@Entity(tableName = "daily_journals")
data class DailyJournal(
    @PrimaryKey val date: String,
    val mood: String = "🙂",
    val highlight: String = "",
    val improvement: String = "",
    val tomorrowGoals: String = "",
    val note: String = ""
)

data class BackupData(
    val subjects: List<StudySubject> = emptyList(),
    val sessions: List<StudySession> = emptyList(),
    val books: List<Book> = emptyList(),
    val bookLogs: List<BookLog> = emptyList(),
    val habits: List<Habit> = emptyList(),
    val habitLogs: List<HabitLog> = emptyList(),
    val savingGoals: List<SavingGoal> = emptyList(),
    val moneyEntries: List<MoneyEntry> = emptyList(),
    val journals: List<DailyJournal> = emptyList()
)

@Dao
interface StartFreshDao {
    @Query("SELECT * FROM subjects ORDER BY id DESC") fun observeSubjects(): Flow<List<StudySubject>>
    @Query("SELECT * FROM study_sessions ORDER BY createdAt DESC") fun observeSessions(): Flow<List<StudySession>>
    @Query("SELECT * FROM books ORDER BY createdAt DESC") fun observeBooks(): Flow<List<Book>>
    @Query("SELECT * FROM book_logs ORDER BY id DESC") fun observeBookLogs(): Flow<List<BookLog>>
    @Query("SELECT * FROM habits ORDER BY id DESC") fun observeHabits(): Flow<List<Habit>>
    @Query("SELECT * FROM habit_logs ORDER BY id DESC") fun observeHabitLogs(): Flow<List<HabitLog>>
    @Query("SELECT * FROM saving_goals ORDER BY id DESC") fun observeSavingGoals(): Flow<List<SavingGoal>>
    @Query("SELECT * FROM money_entries ORDER BY date DESC, id DESC") fun observeMoneyEntries(): Flow<List<MoneyEntry>>
    @Query("SELECT * FROM daily_journals ORDER BY date DESC") fun observeJournals(): Flow<List<DailyJournal>>

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertSubject(value: StudySubject): Long
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertSession(value: StudySession): Long
    @Update suspend fun updateSession(value: StudySession)
    @Query("DELETE FROM study_sessions WHERE id = :id") suspend fun deleteSession(id: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertBook(value: Book): Long
    @Update suspend fun updateBook(value: Book)
    @Query("DELETE FROM books WHERE id = :id") suspend fun deleteBook(id: Long)
    @Query("DELETE FROM book_logs WHERE bookId = :bookId") suspend fun deleteBookLogsForBook(bookId: Long)
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertBookLog(value: BookLog): Long
    @Query("SELECT * FROM book_logs WHERE bookId = :bookId AND date = :date LIMIT 1") suspend fun findBookLog(bookId: Long, date: String): BookLog?

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertHabit(value: Habit): Long
    @Update suspend fun updateHabit(value: Habit)
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertHabitLog(value: HabitLog): Long
    @Query("SELECT * FROM habit_logs WHERE habitId = :habitId AND date = :date LIMIT 1") suspend fun findHabitLog(habitId: Long, date: String): HabitLog?
    @Query("DELETE FROM habits WHERE id = :id") suspend fun deleteHabit(id: Long)
    @Query("DELETE FROM habit_logs WHERE habitId = :habitId") suspend fun deleteHabitLogsForHabit(habitId: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertSavingGoal(value: SavingGoal): Long
    @Update suspend fun updateSavingGoal(value: SavingGoal)
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertMoneyEntry(value: MoneyEntry): Long
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertJournal(value: DailyJournal)

    @Query("DELETE FROM subjects") suspend fun clearSubjects()
    @Query("DELETE FROM study_sessions") suspend fun clearSessions()
    @Query("DELETE FROM books") suspend fun clearBooks()
    @Query("DELETE FROM book_logs") suspend fun clearBookLogs()
    @Query("DELETE FROM habits") suspend fun clearHabits()
    @Query("DELETE FROM habit_logs") suspend fun clearHabitLogs()
    @Query("DELETE FROM saving_goals") suspend fun clearSavingGoals()
    @Query("DELETE FROM money_entries") suspend fun clearMoneyEntries()
    @Query("DELETE FROM daily_journals") suspend fun clearJournals()

    @Insert suspend fun restoreSubjects(values: List<StudySubject>)
    @Insert suspend fun restoreSessions(values: List<StudySession>)
    @Insert suspend fun restoreBooks(values: List<Book>)
    @Insert suspend fun restoreBookLogs(values: List<BookLog>)
    @Insert suspend fun restoreHabits(values: List<Habit>)
    @Insert suspend fun restoreHabitLogs(values: List<HabitLog>)
    @Insert suspend fun restoreSavingGoals(values: List<SavingGoal>)
    @Insert suspend fun restoreMoneyEntries(values: List<MoneyEntry>)
    @Insert suspend fun restoreJournals(values: List<DailyJournal>)

    @Transaction
    suspend fun replaceAll(data: BackupData) {
        clearSubjects(); clearSessions(); clearBooks(); clearBookLogs()
        clearHabits(); clearHabitLogs(); clearSavingGoals(); clearMoneyEntries(); clearJournals()
        if (data.subjects.isNotEmpty()) restoreSubjects(data.subjects)
        if (data.sessions.isNotEmpty()) restoreSessions(data.sessions)
        if (data.books.isNotEmpty()) restoreBooks(data.books)
        if (data.bookLogs.isNotEmpty()) restoreBookLogs(data.bookLogs)
        if (data.habits.isNotEmpty()) restoreHabits(data.habits)
        if (data.habitLogs.isNotEmpty()) restoreHabitLogs(data.habitLogs)
        if (data.savingGoals.isNotEmpty()) restoreSavingGoals(data.savingGoals)
        if (data.moneyEntries.isNotEmpty()) restoreMoneyEntries(data.moneyEntries)
        if (data.journals.isNotEmpty()) restoreJournals(data.journals)
    }
}

@Database(
    entities = [
        StudySubject::class, StudySession::class, Book::class, BookLog::class,
        Habit::class, HabitLog::class, SavingGoal::class, MoneyEntry::class, DailyJournal::class
    ],
    version = 1,
    exportSchema = false
)
abstract class StartFreshDatabase : RoomDatabase() {
    abstract fun dao(): StartFreshDao

    companion object {
        @Volatile private var INSTANCE: StartFreshDatabase? = null
        fun get(context: Context): StartFreshDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    StartFreshDatabase::class.java,
                    "start_fresh.db"
                ).build().also { INSTANCE = it }
            }
    }
}
