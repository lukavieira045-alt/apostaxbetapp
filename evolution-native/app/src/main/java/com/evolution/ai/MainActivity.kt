package com.evolution.ai

import android.graphics.*
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.view.Gravity
import android.view.View
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
import kotlin.math.*

class MainActivity : AppCompatActivity() {
    private lateinit var status: TextView
    private lateinit var chat: TextView
    private lateinit var input: EditText
    private lateinit var send: Button
    private lateinit var core: EvolutionCoreView
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
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(18, 14, 18, 12)
            setBackgroundColor(Color.rgb(3, 6, 12))
        }

        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val title = TextView(this).apply {
            text = "EVOLUTION"
            textSize = 23f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
        }
        status = TextView(this).apply {
            text = "  •  NÚCLEO LOCAL"
            textSize = 11f
            setTextColor(Color.rgb(92, 225, 255))
            setPadding(10, 0, 0, 0)
        }
        header.addView(title)
        header.addView(status)
        root.addView(header)

        core = EvolutionCoreView(this)
        root.addView(core, LinearLayout.LayoutParams(-1, 0, 0.48f))

        chat = TextView(this).apply {
            textSize = 15f
            setTextColor(Color.rgb(229, 242, 255))
            setPadding(10, 8, 10, 8)
            text = "NÚCLEO EVOLUTION\nInicializando inteligência local..."
            setBackgroundColor(Color.rgb(7, 12, 22))
        }
        val scroll = ScrollView(this).apply {
            addView(chat)
            setBackgroundColor(Color.rgb(7, 12, 22))
        }
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 0.27f))

        val controls = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 8, 0, 0)
        }
        input = EditText(this).apply {
            hint = "Fale com a Evolution..."
            setHintTextColor(Color.rgb(95, 112, 135))
            setTextColor(Color.WHITE)
            setSingleLine(false)
            minLines = 2
            setBackgroundColor(Color.rgb(11, 18, 31))
            setPadding(16, 10, 16, 10)
        }
        send = Button(this).apply {
            text = "➤"
            textSize = 21f
            isEnabled = false
            setTextColor(Color.WHITE)
            setOnClickListener { ask() }
        }
        controls.addView(input, LinearLayout.LayoutParams(0, -2, 1f))
        controls.addView(send, LinearLayout.LayoutParams(62, 58))
        root.addView(controls)

        val footer = TextView(this).apply {
            text = "CORE 5K  •  60 FPS  •  MEMÓRIA  •  VOZ  •  PESQUISA WEB"
            textSize = 9f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(91, 125, 153))
            setPadding(0, 7, 0, 0)
        }
        root.addView(footer)
        setContentView(root)
    }

    private suspend fun prepareBrain() = withContext(Dispatchers.IO) {
        try {
            val dir = File(getExternalFilesDir("models"), "").apply { mkdirs() }
            modelFile = File(dir, MODEL_NAME)
            if (!modelFile.exists() || modelFile.length() < 100_000_000) downloadModel(modelFile)
            withContext(Dispatchers.Main) {
                status.text = "  •  CÉREBRO PRONTO • LOCAL"
                chat.text = "NÚCLEO EVOLUTION ONLINE\nInteligência local pronta. Memória, matemática, voz e pesquisa estão disponíveis.\n\nPode falar comigo, meu Rei."
                send.isEnabled = true
                core.setReady(true)
            }
        } catch (e: Exception) {
            withContext(Dispatchers.Main) {
                status.text = "  •  NÚCLEO EM RECUPERAÇÃO"
                chat.text = "O núcleo não conseguiu preparar o modelo: ${e.message ?: "erro desconhecido"}"
                core.setReady(false)
            }
        }
    }

    private fun downloadModel(file: File) {
        val conn = URL(MODEL_URL).openConnection() as HttpURLConnection
        conn.connectTimeout = 30000
        conn.readTimeout = 120000
        conn.requestMethod = "GET"
        conn.connect()
        if (conn.responseCode !in 200..299) error("download HTTP ${conn.responseCode}")
        val total = conn.contentLengthLong
        conn.inputStream.use { input ->
            file.outputStream().use { output ->
                val buffer = ByteArray(1024 * 1024)
                var done = 0L
                var n: Int
                while (input.read(buffer).also { n = it } >= 0) {
                    if (n == 0) continue
                    output.write(buffer, 0, n)
                    done += n
                    if (total > 0 && done % (8L * 1024 * 1024) < n) {
                        val pct = (done * 100 / total)
                        runOnUiThread { status.text = "  •  BAIXANDO NÚCLEO $pct%" }
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
        core.setThinking(true)
        lifecycleScope.launch {
            try {
                val answer = withContext(Dispatchers.IO) { answerFor(q) }
                append("Evolution: $answer\n")
                saveMemory(q, answer)
                tts.speak(answer, TextToSpeech.QUEUE_FLUSH, null, "evolution-answer")
            } catch (e: Exception) {
                append("Evolution: não consegui concluir esta resposta: ${e.message}\n")
            }
            core.setThinking(false)
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
        val urls = listOf(
            "https://www.google.com/search?q=$q&hl=pt-BR",
            "https://www.bing.com/search?q=$q&setlang=pt-BR"
        )
        for (u in urls) try {
            val c = URL(u).openConnection() as HttpURLConnection
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Android) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36")
            c.connectTimeout = 10000
            c.readTimeout = 15000
            val text = c.inputStream.bufferedReader().use { it.readText() }
            c.disconnect()
            val clean = text
                .replace(Regex("<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>"), " ")
                .replace(Regex("<[^>]+>"), " ")
                .replace(Regex("\\s+"), " ")
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
    override fun onDestroy() {
        if (::tts.isInitialized) tts.shutdown()
        if (::core.isInitialized) core.stop()
        super.onDestroy()
    }
}

class EvolutionCoreView(context: android.content.Context) : View(context) {
    private val p = Paint(Paint.ANTI_ALIAS_FLAG)
    private val glow = Paint(Paint.ANTI_ALIAS_FLAG)
    private val tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 22)
    private var angle = 0f
    private var eyeX = 0f
    private var eyeY = 0f
    private var ready = false
    private var thinking = false
    private var lastSound = 0L
    private var running = true

    init {
        setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        p.typeface = Typeface.DEFAULT_BOLD
        postInvalidateOnAnimation()
    }

    fun setReady(value: Boolean) { ready = value; invalidate() }
    fun setThinking(value: Boolean) { thinking = value; invalidate() }
    fun stop() { running = false; tone.release() }

    override fun onDraw(c: Canvas) {
        super.onDraw(c)
        if (!running) return
        val w = width.toFloat()
        val h = height.toFloat()
        val cx = w / 2f
        val cy = h * 0.52f
        val r = min(w, h) * 0.28f
        c.drawColor(Color.rgb(3, 6, 12))

        // Deep-space grid and ambient energy field.
        val grid = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(18, 70, 190, 255); strokeWidth = 1f }
        var gx = 0f
        while (gx < w) { c.drawLine(gx, 0f, gx, h, grid); gx += 34f }
        var gy = 0f
        while (gy < h) { c.drawLine(0f, gy, w, gy, grid); gy += 34f }

        angle = (angle + if (thinking) 1.25f else 0.62f) % 360f
        val pulse = 1f + sin(angle * PI / 180.0).toFloat() * 0.035f
        val coreR = r * pulse

        // Large soft aura.
        glow.color = Color.argb(90, 20, 190, 255)
        glow.style = Paint.Style.FILL
        glow.setShadowLayer(r * 0.65f, 0f, 0f, Color.argb(130, 40, 180, 255))
        c.drawCircle(cx, cy, coreR * 0.72f, glow)
        glow.clearShadowLayer()

        // Precision rings.
        for (i in 0..4) {
            p.style = Paint.Style.STROKE
            p.strokeWidth = if (i == 0) 3f else 1.2f
            p.color = when (i % 3) {
                0 -> Color.argb(210, 73, 220, 255)
                1 -> Color.argb(120, 150, 91, 255)
                else -> Color.argb(110, 255, 67, 193)
            }
            val rr = coreR * (1.05f + i * 0.17f)
            val oval = RectF(cx - rr, cy - rr * 0.72f, cx + rr, cy + rr * 0.72f)
            c.save()
            c.rotate(angle * (if (i % 2 == 0) 1f else -0.65f), cx, cy)
            c.drawOval(oval, p)
            c.restore()
        }

        // Moving energy nodes.
        for (i in 0 until 18) {
            val a = Math.toRadians(angle * (0.7 + i % 3 * 0.23) + i * 20.0)
            val rr = coreR * (1.08f + (i % 5) * 0.13f)
            val x = cx + cos(a).toFloat() * rr
            val y = cy + sin(a).toFloat() * rr * 0.72f
            p.style = Paint.Style.FILL
            p.color = if (i % 3 == 0) Color.rgb(255, 74, 195) else Color.rgb(67, 220, 255)
            c.drawCircle(x, y, if (i % 4 == 0) 3.2f else 1.7f, p)
        }

        // The actual nucleus: layered glass/energy sphere.
        val grad = RadialGradient(cx - coreR * 0.2f, cy - coreR * 0.22f, coreR,
            intArrayOf(Color.rgb(235, 255, 255), Color.rgb(70, 218, 255), Color.rgb(26, 69, 150), Color.rgb(6, 11, 28)),
            floatArrayOf(0f, .18f, .55f, 1f), Shader.TileMode.CLAMP)
        p.shader = grad
        p.style = Paint.Style.FILL
        p.setShadowLayer(24f, 0f, 0f, Color.argb(180, 43, 198, 255))
        c.drawCircle(cx, cy, coreR, p)
        p.clearShadowLayer()
        p.shader = null

        // Central AI eye / sensor.
        eyeX = sin(angle * 0.035f).toFloat() * coreR * 0.17f
        eyeY = cos(angle * 0.027f).toFloat() * coreR * 0.08f
        if (thinking) { eyeX += sin(angle * .12f).toFloat() * 7f }
        p.style = Paint.Style.FILL
        p.color = Color.argb(245, 2, 8, 17)
        c.drawOval(RectF(cx - coreR * .58f, cy - coreR * .20f, cx + coreR * .58f, cy + coreR * .20f), p)
        p.color = if (ready) Color.rgb(112, 241, 255) else Color.rgb(120, 145, 165)
        p.setShadowLayer(18f, 0f, 0f, p.color)
        c.drawOval(RectF(cx - coreR * .39f + eyeX, cy - coreR * .075f + eyeY, cx + coreR * .39f + eyeX, cy + coreR * .075f + eyeY), p)
        p.clearShadowLayer()

        // Technical readout.
        p.style = Paint.Style.FILL
        p.textAlign = Paint.Align.CENTER
        p.textSize = 10f
        p.color = Color.rgb(100, 169, 196)
        c.drawText(if (thinking) "EVOLUTION • PROCESSANDO" else if (ready) "EVOLUTION • NÚCLEO ONLINE" else "EVOLUTION • INICIALIZANDO", cx, h - 16f, p)
        p.textSize = 8f
        p.color = Color.rgb(64, 103, 126)
        c.drawText("CORE 5K  /  60 FPS  /  LOCAL INTELLIGENCE", cx, h - 4f, p)

        if (System.currentTimeMillis() - lastSound > 2600L) {
            lastSound = System.currentTimeMillis()
            try { tone.startTone(ToneGenerator.TONE_PROP_BEEP, 35) } catch (_: Exception) {}
        }
        postInvalidateOnAnimation()
    }
}

object Calculator {
    fun tryCalculate(text: String): String? {
        val candidate = text.replace("quanto é", "", ignoreCase = true).replace("calcule", "", ignoreCase = true).trim()
        if (!Regex("^[0-9+*/().,%\\- xX÷]+$").matches(candidate)) return null
        return try {
            val value = Parser(candidate.replace("x", "*", true).replace("÷", "/").replace(",", ".")).parse()
            "Resultado: $value"
        } catch (_: Exception) { null }
    }
    private class Parser(private val s: String) {
        var i = 0
        fun parse(): Double { val v = expr(); if (i < s.length) error("extra"); return v }
        fun expr(): Double { var v = term(); while (i < s.length && (s[i] == '+' || s[i] == '-')) { val op = s[i++]; val n = term(); v = if (op == '+') v + n else v - n }; return v }
        fun term(): Double { var v = factor(); while (i < s.length && (s[i] == '*' || s[i] == '/')) { val op = s[i++]; val n = factor(); v = if (op == '*') v * n else v / n }; return v }
        fun factor(): Double { while (i < s.length && s[i].isWhitespace()) i++; if (i < s.length && s[i] == '-') { i++; return -factor() }; if (i < s.length && s[i] == '(') { i++; val v = expr(); if (i >= s.length || s[i++] != ')') error("paren"); return v }; val st = i; while (i < s.length && (s[i].isDigit() || s[i] == '.')) i++; if (st == i) error("number"); return s.substring(st, i).toDouble() }
    }
}
