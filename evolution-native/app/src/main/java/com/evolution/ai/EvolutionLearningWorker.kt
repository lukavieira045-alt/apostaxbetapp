package com.evolution.ai

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Persistent background adaptation loop.
 * It does not retrain neural weights. It continuously grows Evolution's local
 * knowledge/memory store from recent conversations and public web evidence when
 * connectivity exists, and still performs local memory maintenance offline.
 */
class EvolutionLearningWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences("evolution_memory", Context.MODE_PRIVATE)
        val now = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        val memory = prefs.getString("items", "").orEmpty()
        val learning = prefs.getString("learning_stream", "").orEmpty()
        val topic = extractLatestUserTopic(memory)

        val evidence = if (topic.isNotBlank()) searchPublicWeb(topic) else ""
        val entry = buildString {
            append("[$now] CICLO DE APRENDIZADO\n")
            if (evidence.isNotBlank()) {
                append("Tema: ").append(topic).append("\n")
                append("Evidência web: ").append(evidence.take(5000)).append("\n")
            } else {
                append("Ciclo local/offline: memória mantida e organizada; sem evidência web disponível.\n")
            }
            append("---\n")
        }

        prefs.edit()
            .putString("learning_stream", (learning + entry).takeLast(60000))
            .putLong("last_learning_at", System.currentTimeMillis())
            .apply()

        return Result.success()
    }

    private fun extractLatestUserTopic(memory: String): String {
        val lines = memory.split('\n').asReversed()
        return lines.firstOrNull { it.startsWith("Usuário:") }
            ?.removePrefix("Usuário:")
            ?.trim()
            ?.take(240)
            ?.takeIf { it.length >= 4 && !it.matches(Regex("(?i)^(oi|olá|ola|bom dia|boa tarde|boa noite|valeu|obrigado)[!. ]*$")) }
            .orEmpty()
    }

    private fun searchPublicWeb(topic: String): String {
        return try {
            val q = URLEncoder.encode(topic, "UTF-8")
            val url = URL("https://html.duckduckgo.com/html/?q=$q")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000
                readTimeout = 12000
                setRequestProperty("User-Agent", "Mozilla/5.0 (Android) Evolution/1.0")
            }
            val html = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()
            html
                .replace(Regex("<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>"), " ")
                .replace(Regex("<[^>]+>"), " ")
                .replace(Regex("\\s+"), " ")
                .trim()
                .take(5000)
        } catch (_: Exception) {
            ""
        }
    }
}

/** Small deterministic calculator used before the local LLM for basic arithmetic. */
object Calculator {
    fun tryCalculate(input: String): String? {
        var s = input.trim()
            .replace(Regex("(?i)quanto é|quanto e|calcule|calcular|resultado de"), "")
            .replace(',', '.')
            .trim()
        if (!Regex("^[0-9+\\-*/().%\\s]+$").matches(s)) return null
        if (!Regex(".*[+*/%\\-].*").matches(s)) return null
        return try {
            val value = Parser(s).parse()
            if (!value.isFinite()) null else if (value % 1.0 == 0.0) "Resultado: ${value.toLong()}" else "Resultado: ${"%.10f".format(Locale.US, value).trimEnd('0').trimEnd('.') }"
        } catch (_: Exception) { null }
    }

    private class Parser(private val text: String) {
        private var pos = 0
        fun parse(): Double { val v = expression(); skip(); if (pos != text.length) error("syntax"); return v }
        private fun expression(): Double { var v = term(); while (true) { skip(); if (eat('+')) v += term() else if (eat('-')) v -= term() else return v } }
        private fun term(): Double { var v = factor(); while (true) { skip(); if (eat('*')) v *= factor() else if (eat('/')) v /= factor() else if (eat('%')) v %= factor() else return v } }
        private fun factor(): Double { skip(); if (eat('+')) return factor(); if (eat('-')) return -factor(); if (eat('(')) { val v = expression(); if (!eat(')')) error("paren"); return v }; val start=pos; while (pos<text.length && (text[pos].isDigit() || text[pos]=='.')) pos++; if (start==pos) error("number"); return text.substring(start,pos).toDouble() }
        private fun skip() { while (pos<text.length && text[pos].isWhitespace()) pos++ }
        private fun eat(c: Char): Boolean { skip(); if (pos<text.length && text[pos]==c) { pos++; return true }; return false }
    }
}
