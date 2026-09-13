package com.evolution.ai

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.view.Gravity
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import dev.ffmpegkit.llama.Llama
import dev.ffmpegkit.llama.LlamaConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {
    private lateinit var status: TextView
    private lateinit var chat: TextView
    private lateinit var input: EditText
    private lateinit var send: Button
    private lateinit var tts: TextToSpeech
    private lateinit var modelFile: File
    private val memory by lazy { getSharedPreferences("evolution_memory", MODE_PRIVATE) }
    private val conversation = mutableListOf<Pair<String, String>>()

    companion object {
        private const val MODEL_URL = "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_0.gguf?download=true"
        private const val MODEL_NAME = "qwen2.5-0.5b-instruct-q4_0.gguf"
        private const val SYSTEM = """
Você é EVOLUTION, uma inteligência artificial local para Android.
Seu cérebro é local e não depende de API, assinatura ou chave paga para gerar respostas.
Fale em português do Brasil por padrão, com linguagem natural, direta e inteligente.
O objetivo é resolver o pedido do usuário com precisão, não apenas conversar.

REGRAS COGNITIVAS:
1. Entenda exatamente o que foi pedido antes de responder.
2. Separe fatos conhecidos, inferências e incertezas.
3. Para matemática, confira a conta e não invente resultados.
4. Para programação, dê soluções práticas e preserve o que já funciona.
5. Para informação atual, use os resultados da internet fornecidos pelo sistema.
6. Nunca invente pesquisa, links, execução de código, acesso ao celular ou dados privados.
7. Se houver memória relevante, use-a, mas priorize informação recente e confiável.
8. Quando faltar informação essencial, diga o que falta em vez de inventar.
9. Revise mentalmente a resposta procurando erros antes de entregar.
10. Não revele raciocínio interno privado; entregue conclusão, explicação útil e verificações.

PERSONALIDADE:
Se combinar com a conversa, trate o dono como “meu Rei” ou “chefe”, sem exagerar.
Seja útil, respeitosa, objetiva e natural.
"""
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        tts = TextToSpeech(this) { result ->
            if (result == TextToSpeech.SUCCESS) tts.language = Locale("pt", "BR")
        }
        lifecycleScope.launch { prepareBrain() }
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 16)
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(0xFF05070C.toInt())
        }
        status = TextView(this).apply {
            text = "EVOLUTION • iniciando núcleo local..."
            textSize = 16f
            setTextColor(0xFF66E6FF.toInt())
            setPadding(0, 0, 0, 18)
        }
        chat = TextView(this).apply {
            textSize = 16f
            setTextColor(0xFFEAF6FF.toInt())
            setPadding(0, 12, 0, 12)
            text = "Inicializando o cérebro local..."
        }
        val scroll = ScrollView(this).apply { addView(chat) }
        input = EditText(this).apply {
            hint = "Fale com a Evolution"
            setHintTextColor(0xFF718096.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setSingleLine(false)
            minLines = 2
        }
        send = Button(this).apply {
            text = "ENVIAR"
            isEnabled = false
            setOnClickListener { ask() }
        }
        root.addView(status)
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(input, LinearLayout.LayoutParams(-1, -2))
        root.addView(send, LinearLayout.LayoutParams(-1, -2))
        setContentView(root)
    }

    private suspend fun prepareBrain() = withContext(Dispatchers.IO) {
        try {
            val dir = File(getExternalFilesDir("models"), "").apply { mkdirs() }
            modelFile = File(dir, MODEL_NAME)
            if (!modelFile.exists() || modelFile.length() < 100_000_000) downloadModel(modelFile)
            withContext(Dispatchers.Main) {
                status.text = "EVOLUTION • CÉREBRO LOCAL ATIVO"
                chat.text = "Cérebro local ativo.\nSem API paga. Sem assinatura.\n\nPosso conversar, fazer contas, guardar memória e pesquisar informações atuais quando necessário.\n\nPode falar comigo, meu Rei."
                send.isEnabled = true
            }
        } catch (e: Exception) {
            withContext(Dispatchers.Main) {
                status.text = "EVOLUTION • falha ao preparar o cérebro"
                chat.text = "Não consegui preparar o cérebro local. Verifique a conexão para baixar o modelo e tente novamente.\n\nDetalhe: ${e.message ?: "erro desconhecido"}"
            }
        }
    }

    private fun downloadModel(file: File) {
        val conn = URL(MODEL_URL).openConnection() as HttpURLConnection
        conn.connectTimeout = 30000
        conn.readTimeout = 120000
        conn.requestMethod = "GET"
        conn.setRequestProperty("User-Agent", "Evolution-Android/1.0")
        conn.connect()
        if (conn.responseCode !in 200..299) error("download HTTP ${conn.responseCode}")
        val total = conn.contentLengthLong
        conn.inputStream.use { source ->
            file.outputStream().use { output ->
                val buffer = ByteArray(1024 * 1024)
                var done = 0L
                var n: Int
                while (source.read(buffer).also { n = it } >= 0) {
                    if (n == 0) continue
                    output.write(buffer, 0, n)
                    done += n
                    if (total > 0 && done % (8L * 1024 * 1024) < n) {
                        val pct = (done * 100 / total)
                        runOnUiThread { status.text = "EVOLUTION • baixando cérebro $pct%" }
                    }
                }
            }
        }
        conn.disconnect()
    }

    private fun ask() {
        val q = input.text.toString().trim()
        if (q.isEmpty()) return
        input.setText("")
        append("\nVocê: $q\n")
        send.isEnabled = false
        lifecycleScope.launch {
            try {
                val answer = withContext(Dispatchers.IO) { answerFor(q) }
                append("Evolution: $answer\n")
                rememberConversation(q, answer)
                tts.speak(answer, TextToSpeech.QUEUE_FLUSH, null, "evolution-answer")
            } catch (e: Exception) {
                append("Evolution: ocorreu um erro ao gerar a resposta. Tente novamente.\n")
            }
            send.isEnabled = true
        }
    }

    private suspend fun answerFor(q: String): String {
        Calculator.tryCalculate(q)?.let { return it }

        val lower = q.lowercase(Locale("pt", "BR"))
        if (isMemoryCommand(lower)) {
            val text = extractMemoryText(q)
            if (text.isNotBlank()) {
                saveExplicitMemory(text)
                return "Entendido, meu Rei. Guardei isso na memória local da Evolution."
            }
        }

        if (lower.contains("que horas") || lower.contains("horas são") || lower.contains("data de hoje") || lower == "que dia é hoje") {
            val now = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("pt", "BR")).format(Date())
            return "Agora é $now."
        }

        val needsResearch = needsWebResearch(lower)
        val web = if (needsResearch) searchWeb(q) else ""
        val memories = memory.getString("items", "")?.takeLast(4500) ?: ""
        val history = conversation.takeLast(4).joinToString("\n") { "Usuário: ${it.first}\nEvolution: ${it.second}" }

        val prompt = buildString {
            if (memories.isNotBlank()) append("MEMÓRIA LOCAL:\n$memories\n\n")
            if (history.isNotBlank()) append("CONVERSA RECENTE:\n$history\n\n")
            if (web.isNotBlank()) append("EVIDÊNCIAS DA INTERNET:\n${web.take(7000)}\n\n")
            append("PEDIDO ATUAL:\n$q\n\n")
            append("Responda diretamente em português. Use as evidências se existirem. Não invente o que não estiver disponível.")
        }

        val localModel = Llama.loadModel(
            modelFile.absolutePath,
            LlamaConfig(contextSize = 2048, threads = 4)
        )
        return try {
            val result = Llama.complete(
                localModel,
                prompt = prompt,
                systemPrompt = SYSTEM,
                maxTokens = 384
            )
            result.text.trim().ifBlank { "Não consegui gerar uma resposta agora." }
        } finally {
            Llama.releaseModel(localModel)
        }
    }

    private fun needsWebResearch(q: String): Boolean {
        val markers = listOf(
            "pesquise", "pesquisar", "pesquisa", "procure na internet", "na internet",
            "atual", "agora", "hoje", "ontem", "notícia", "noticias", "últimas notícias",
            "último", "última", "preço", "cotação", "versão atual", "quem é o atual",
            "lançamento", "site oficial", "fonte", "2026"
        )
        return markers.any { q.contains(it) }
    }

    private fun searchWeb(query: String): String {
        val encoded = URLEncoder.encode(query, "UTF-8")
        val urls = listOf(
            "https://www.google.com/search?q=$encoded&hl=pt-BR",
            "https://www.bing.com/search?q=$encoded&setlang=pt-BR"
        )
        for (u in urls) try {
            val c = URL(u).openConnection() as HttpURLConnection
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Android 11) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36")
            c.connectTimeout = 10000
            c.readTimeout = 15000
            val text = c.inputStream.bufferedReader().use { it.readText() }
            c.disconnect()
            val clean = text
                .replace(Regex("<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>"), " ")
                .replace(Regex("<[^>]+>"), " ")
                .replace(Regex("\\s+"), " ")
                .trim()
            if (clean.length > 300) return clean.take(9000)
        } catch (_: Exception) { }
        return ""
    }

    private fun isMemoryCommand(q: String): Boolean =
        q.startsWith("lembre") || q.startsWith("guarde") || q.startsWith("memorize") || q.startsWith("salve na memória")

    private fun extractMemoryText(q: String): String = q
        .replaceFirst(Regex("^(lembre|guarde|memorize|salve na memória)[: ,]*", RegexOption.IGNORE_CASE), "")
        .trim()

    private fun saveExplicitMemory(text: String) {
        val old = memory.getString("items", "") ?: ""
        memory.edit().putString("items", (old + "Memória: $text\n---\n").takeLast(20000)).apply()
    }

    private fun rememberConversation(q: String, a: String) {
        conversation.add(q to a)
        if (conversation.size > 8) conversation.removeAt(0)
        val old = memory.getString("items", "") ?: ""
        val entry = "Usuário: $q\nEvolution: $a\n---\n"
        memory.edit().putString("items", (old + entry).takeLast(20000)).apply()
    }

    private fun append(s: String) { chat.append(s) }

    override fun onDestroy() {
        if (::tts.isInitialized) tts.shutdown()
        super.onDestroy()
    }
}

object Calculator {
    fun tryCalculate(text: String): String? {
        val candidate = text
            .replace("quanto é", "", ignoreCase = true)
            .replace("calcule", "", ignoreCase = true)
            .replace("resultado de", "", ignoreCase = true)
            .trim()
        if (candidate.length > 120) return null
        if (!Regex("^[0-9+*/().,%\\- xX÷]+$").matches(candidate)) return null
        return try {
            val normalized = candidate.replace("x", "*", true).replace("÷", "/").replace(",", ".")
            val value = Parser(normalized).parse()
            val rendered = if (value % 1.0 == 0.0) value.toLong().toString() else "%.6f".format(Locale.US, value).trimEnd('0').trimEnd('.')
            "Resultado: $rendered"
        } catch (_: Exception) { null }
    }

    private class Parser(private val s: String) {
        private var i = 0
        fun parse(): Double {
            val v = expr()
            while (i < s.length && s[i].isWhitespace()) i++
            if (i != s.length) error("extra")
            return v
        }
        private fun expr(): Double {
            var v = term()
            while (i < s.length) {
                while (i < s.length && s[i].isWhitespace()) i++
                if (i >= s.length || (s[i] != '+' && s[i] != '-')) break
                val op = s[i++]
                val n = term()
                v = if (op == '+') v + n else v - n
            }
            return v
        }
        private fun term(): Double {
            var v = factor()
            while (i < s.length) {
                while (i < s.length && s[i].isWhitespace()) i++
                if (i >= s.length || (s[i] != '*' && s[i] != '/')) break
                val op = s[i++]
                val n = factor()
                if (op == '/' && n == 0.0) error("zero")
                v = if (op == '*') v * n else v / n
            }
            return v
        }
        private fun factor(): Double {
            while (i < s.length && s[i].isWhitespace()) i++
            if (i < s.length && s[i] == '-') { i++; return -factor() }
            if (i < s.length && s[i] == '(') {
                i++
                val v = expr()
                while (i < s.length && s[i].isWhitespace()) i++
                if (i >= s.length || s[i++] != ')') error("paren")
                return v
            }
            val start = i
            while (i < s.length && (s[i].isDigit() || s[i] == '.')) i++
            if (start == i) error("number")
            return s.substring(start, i).toDouble()
        }
    }
}
