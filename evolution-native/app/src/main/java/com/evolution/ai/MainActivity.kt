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
import java.util.Locale

class MainActivity : AppCompatActivity() {
    private lateinit var status: TextView
    private lateinit var chat: TextView
    private lateinit var input: EditText
    private lateinit var send: Button
    private lateinit var tts: TextToSpeech
    private lateinit var modelFile: File
    private val memory by lazy { getSharedPreferences("evolution_memory", MODE_PRIVATE) }

    companion object {
        private const val MODEL_URL = "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_0.gguf?download=true"
        private const val MODEL_NAME = "qwen2.5-0.5b-instruct-q4_0.gguf"
        private const val SYSTEM = """
Você é EVOLUTION, uma inteligência artificial local, direta, natural e extremamente cuidadosa.
Você roda no aparelho do usuário e não depende de API paga. Responda em português do Brasil, salvo se o usuário pedir outro idioma.
Seu objetivo é resolver o problema, não apenas conversar.
Antes de responder, interprete o pedido, identifique o que é necessário, use cálculo ou pesquisa quando isso for necessário, confira a resposta e então responda.
Nunca invente fatos, resultados de pesquisa, execução de código ou acesso a dados que você não possui.
Se a pergunta depender de informação atual, use os resultados de pesquisa fornecidos pelo sistema.
Se houver memória relevante, use-a, mas prefira informação mais recente e confiável.
Se o usuário pedir matemática, faça as contas com cuidado e mostre o resultado.
Se pedir programação, entregue uma solução prática e preserve o que já funciona.
Você pode tratar o dono naturalmente como "meu Rei" ou "chefe" quando combinar com a conversa, sem exagerar.
Não revele raciocínio interno privado; forneça apenas conclusão, passos úteis e verificações.
"""
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        tts = TextToSpeech(this) { tts.language = Locale("pt", "BR") }
        lifecycleScope.launch { prepareBrain() }
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 24, 24, 16); gravity = Gravity.CENTER_HORIZONTAL; setBackgroundColor(0xFF05070C.toInt()) }
        status = TextView(this).apply { text = "EVOLUTION • preparando cérebro local..."; textSize = 16f; setTextColor(0xFF66E6FF.toInt()); setPadding(0, 0, 0, 18) }
        chat = TextView(this).apply { textSize = 16f; setTextColor(0xFFEAF6FF.toInt()); setPadding(0, 12, 0, 12); text = "Preparando o núcleo local." }
        val scroll = ScrollView(this).apply { addView(chat) }
        input = EditText(this).apply { hint = "Fale com a Evolution"; setHintTextColor(0xFF718096.toInt()); setTextColor(0xFFFFFFFF.toInt()); setSingleLine(false); minLines = 2 }
        send = Button(this).apply { text = "ENVIAR"; isEnabled = false; setOnClickListener { ask() } }
        root.addView(status); root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f)); root.addView(input, LinearLayout.LayoutParams(-1, -2)); root.addView(send, LinearLayout.LayoutParams(-1, -2)); setContentView(root)
    }

    private suspend fun prepareBrain() = withContext(Dispatchers.IO) {
        try {
            val dir = File(getExternalFilesDir("models"), "").apply { mkdirs() }
            modelFile = File(dir, MODEL_NAME)
            if (!modelFile.exists() || modelFile.length() < 100_000_000) downloadModel(modelFile)
            withContext(Dispatchers.Main) { status.text = "EVOLUTION • CÉREBRO PRONTO (LOCAL / SEM API)"; send.isEnabled = true; chat.text = "Pronto. O núcleo local está carregado em disco. Pode falar comigo." }
        } catch (e: Exception) {
            withContext(Dispatchers.Main) { status.text = "EVOLUTION • erro no cérebro: ${e.message ?: "desconhecido"}"; chat.text = "Não consegui preparar o núcleo local." }
        }
    }

    private fun downloadModel(file: File) {
        val conn = URL(MODEL_URL).openConnection() as HttpURLConnection
        conn.connectTimeout = 30000; conn.readTimeout = 120000; conn.requestMethod = "GET"; conn.connect()
        if (conn.responseCode !in 200..299) error("download HTTP ${conn.responseCode}")
        val total = conn.contentLengthLong
        conn.inputStream.use { input -> file.outputStream().use { output ->
            val buffer = ByteArray(1024 * 1024); var done = 0L; var n: Int
            while (input.read(buffer).also { n = it } >= 0) { if (n == 0) continue; output.write(buffer, 0, n); done += n; if (total > 0 && done % (8L * 1024 * 1024) < n) { val pct = (done * 100 / total); runOnUiThread { status.text = "EVOLUTION • baixando cérebro $pct%" } } }
        } }
        conn.disconnect()
    }

    private fun ask() {
        val q = input.text.toString().trim(); if (q.isEmpty()) return
        input.setText(""); append("\nVocê: $q\n")
        send.isEnabled = false
        lifecycleScope.launch {
            try {
                val answer = withContext(Dispatchers.IO) { answerFor(q) }
                append("Evolution: $answer\n")
                saveMemory(q, answer)
                tts.speak(answer, TextToSpeech.QUEUE_FLUSH, null, "evolution-answer")
            } catch (e: Exception) { append("Evolution: não consegui concluir esta resposta: ${e.message}\n") }
            send.isEnabled = true
        }
    }

    private suspend fun answerFor(q: String): String {
        val math = Calculator.tryCalculate(q)
        if (math != null) return math
        val needsResearch = Regex("\\b(pesquise|pesquisa|procure|pesquisar|atual|agora|hoje|notícia|noticias|últimas|ultimo|última|quem é o atual|preço atual)\\b", RegexOption.IGNORE_CASE).containsMatchIn(q)
        val web = if (needsResearch) searchWeb(q) else ""
        val memories = memory.getString("items", "")?.takeLast(6000) ?: ""
        val prompt = buildString {
            append("Memórias relevantes do usuário:\n").append(memories).append("\n\n")
            if (web.isNotBlank()) append("Resultados recentes da internet. Use apenas como evidência, não invente além deles:\n").append(web.take(9000)).append("\n\n")
            append("Pergunta do usuário:\n").append(q)
        }
        val localModel = Llama.loadModel(modelFile.absolutePath, LlamaConfig(contextSize = 2048, threads = 4))
        return try {
            val result = Llama.complete(localModel, prompt = prompt, systemPrompt = SYSTEM, maxTokens = 384)
            result.text.trim().ifBlank { "Não consegui gerar uma resposta." }
        } finally {
            Llama.releaseModel(localModel)
        }
    }

    private fun searchWeb(query: String): String {
        val q = URLEncoder.encode(query, "UTF-8")
        val urls = listOf("https://www.google.com/search?q=$q&hl=pt-BR", "https://www.bing.com/search?q=$q&setlang=pt-BR")
        for (u in urls) try {
            val c = URL(u).openConnection() as HttpURLConnection
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Android) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36")
            c.connectTimeout = 10000; c.readTimeout = 15000
            val text = c.inputStream.bufferedReader().use { it.readText() }
            c.disconnect()
            val clean = text.replace(Regex("<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>"), " ").replace(Regex("<[^>]+>"), " ").replace(Regex("\\s+"), " ")
            if (clean.length > 300) return clean.take(12000)
        } catch (_: Exception) {}
        return "A pesquisa web não retornou conteúdo acessível agora. Não finja que pesquisou."
    }

    private fun saveMemory(q: String, a: String) {
        val old = memory.getString("items", "") ?: ""
        val entry = "Usuário: $q\nEvolution: $a\n---\n"
        memory.edit().putString("items", (old + entry).takeLast(20000)).apply()
    }

    private fun append(s: String) { chat.append(s) }
    override fun onDestroy() { if (::tts.isInitialized) tts.shutdown(); super.onDestroy() }
}

object Calculator {
    fun tryCalculate(text: String): String? {
        val candidate = text.replace("quanto é", "", ignoreCase = true).replace("calcule", "", ignoreCase = true).trim()
        if (!Regex("^[0-9+*/().,%\\- xX÷]+$").matches(candidate)) return null
        return try { val value = Parser(candidate.replace("x", "*", true).replace("÷", "/").replace(",", ".")).parse(); "Resultado: $value" } catch (_: Exception) { null }
    }
    private class Parser(private val s: String) { var i=0
        fun parse(): Double { val v=expr(); if(i<s.length) error("extra"); return v }
        fun expr(): Double { var v=term(); while(i<s.length && (s[i]=='+'||s[i]=='-')) { val op=s[i++]; val n=term(); v=if(op=='+') v+n else v-n }; return v }
        fun term(): Double { var v=factor(); while(i<s.length && (s[i]=='*'||s[i]=='/')) { val op=s[i++]; val n=factor(); v=if(op=='*') v*n else v/n }; return v }
        fun factor(): Double { while(i<s.length&&s[i].isWhitespace())i++; if(i<s.length&&s[i]=='-'){i++;return-factor()}; if(i<s.length&&s[i]=='('){i++;val v=expr();if(i>=s.length||s[i++]!=')')error("paren");return v}; val st=i; while(i<s.length&&(s[i].isDigit()||s[i]=='.'))i++; if(st==i)error("number"); return s.substring(st,i).toDouble() }
    }
}
