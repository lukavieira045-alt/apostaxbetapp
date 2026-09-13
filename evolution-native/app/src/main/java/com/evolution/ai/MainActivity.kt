package com.evolution.ai

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.*
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
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
    private lateinit var mic: Button
    private lateinit var core: EvolutionCoreView
    private lateinit var tts: android.speech.tts.TextToSpeech
    private lateinit var modelFile: File
    private var busy = false
    private var recognizer: SpeechRecognizer? = null
    private val memory by lazy { getSharedPreferences("evolution_memory", MODE_PRIVATE) }

    companion object {
        private const val MIC = 41
        private const val MODEL_URL = "https://huggingface.co/Qwen/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf?download=true"
        private const val MODEL = "Qwen3-1.7B-Q4_K_M.gguf"
        private const val SYSTEM = """
Você é EVOLUTION, uma inteligência artificial local avançada, criada para resolver problemas de verdade.
Você não é um chatbot de respostas vazias. Entenda a intenção, decomponha tarefas complexas, compare alternativas, faça verificações e entregue uma solução concreta.
Responda em português do Brasil, salvo pedido contrário.
Use memória do usuário quando for relevante. Use matemática e ferramentas quando necessário. Para informação atual, use as evidências web fornecidas.
Nunca invente fatos, fontes, pesquisas, execução de código ou acesso a dados. Diferencie fatos confirmados, inferências e incertezas.
Em programação, raciocine sobre arquitetura, erros, segurança e casos-limite antes de propor a solução. Em matemática, calcule e confira. Em problemas práticos, procure a causa antes de sugerir correções.
Quando houver evidência web, compare fontes e não trate texto de busca como verdade automática.
Você pode pesquisar a internet, analisar resultados, fazer contas e usar memória como ferramentas externas ao seu conhecimento interno.
Se uma ferramenta falhar, diga claramente que falhou e continue com o que puder ser confirmado.
Não revele raciocínio interno privado ou uma cadeia de pensamento; entregue a conclusão, verificações, evidências e passos úteis.
Pode chamar o dono naturalmente de meu Rei ou chefe quando combinar, sem exagerar.
"""
    }

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        buildUi()
        tts = android.speech.tts.TextToSpeech(this) { tts.language = Locale("pt", "BR") }
        setupSpeech()
        lifecycleScope.launch { prepareBrain() }
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 12, 16, 10)
            setBackgroundColor(Color.rgb(3, 6, 12))
        }
        val head = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val title = TextView(this).apply { text = "EVOLUTION"; textSize = 23f; typeface = Typeface.DEFAULT_BOLD; setTextColor(Color.WHITE) }
        status = TextView(this).apply { text = "  •  NÚCLEO LOCAL"; textSize = 11f; setTextColor(Color.rgb(92, 225, 255)); setPadding(10, 0, 0, 0) }
        head.addView(title); head.addView(status); root.addView(head)
        core = EvolutionCoreView(this)
        root.addView(core, LinearLayout.LayoutParams(-1, 0, .46f))
        chat = TextView(this).apply {
            textSize = 15f; setTextColor(Color.rgb(229, 242, 255)); setPadding(12, 10, 12, 10)
            text = "EVOLUTION\nPreparando o cérebro local..."; setBackgroundColor(Color.rgb(7, 12, 22))
        }
        root.addView(ScrollView(this).apply { addView(chat); setBackgroundColor(Color.rgb(7, 12, 22)) }, LinearLayout.LayoutParams(-1, 0, .31f))
        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(0, 7, 0, 0) }
        input = EditText(this).apply {
            hint = "Converse com a Evolution..."; setHintTextColor(Color.rgb(95, 112, 135)); setTextColor(Color.WHITE)
            minLines = 2; setSingleLine(false); setBackgroundColor(Color.rgb(11, 18, 31)); setPadding(15, 9, 15, 9)
        }
        mic = Button(this).apply { text = "FALAR"; textSize = 12f; setTextColor(Color.WHITE); setOnClickListener { startListening() } }
        send = Button(this).apply { text = "ENVIAR"; textSize = 12f; isEnabled = false; setTextColor(Color.WHITE); setOnClickListener { ask() } }
        controls.addView(input, LinearLayout.LayoutParams(0, -2, 1f)); controls.addView(mic, LinearLayout.LayoutParams(78, 58)); controls.addView(send, LinearLayout.LayoutParams(78, 58)); root.addView(controls)
        root.addView(TextView(this).apply {
            text = "NÚCLEO LOCAL  •  VOZ  •  MEMÓRIA  •  RACIOCÍNIO  •  PESQUISA WEB"; textSize = 9f; gravity = Gravity.CENTER
            setTextColor(Color.rgb(91, 125, 153)); setPadding(0, 7, 0, 0)
        })
        setContentView(root)
    }

    private fun setupSpeech() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) return
        recognizer = SpeechRecognizer.createSpeechRecognizer(this)
        recognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(p: Bundle?) { status.text = "  •  OUVINDO" }
            override fun onBeginningOfSpeech() { status.text = "  •  OUVINDO" }
            override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onEndOfSpeech() { status.text = "  •  PROCESSANDO VOZ" }
            override fun onError(e: Int) { status.text = if (busy) "  •  PROCESSANDO" else "  •  CÉREBRO PRONTO • LOCAL" }
            override fun onResults(r: Bundle) {
                val s = r.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                if (s.isNotBlank()) { input.setText(s); input.setSelection(s.length); ask() }
            }
            override fun onPartialResults(p: Bundle?) {}
            override fun onEvent(t: Int, p: Bundle?) {}
        })
    }

    private fun startListening() {
        if (busy || recognizer == null) return
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), MIC); return
        }
        recognizer?.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR")
        })
    }

    override fun onRequestPermissionsResult(c: Int, p: Array<out String>, g: IntArray) {
        super.onRequestPermissionsResult(c, p, g)
        if (c == MIC && g.firstOrNull() == PackageManager.PERMISSION_GRANTED) startListening()
    }

    private suspend fun prepareBrain() = withContext(Dispatchers.IO) {
        try {
            val dir = File(getExternalFilesDir("models"), "").apply { mkdirs() }
            modelFile = File(dir, MODEL)
            if (!modelFile.exists() || modelFile.length() < 1_000_000_000L) download(modelFile)
            withContext(Dispatchers.Main) {
                status.text = "  •  CÉREBRO QWEN3-1.7B • LOCAL"
                chat.text = "EVOLUTION ONLINE\n\nNúcleo de inteligência local carregado.\n\nRaciocínio • memória • matemática • programação • pesquisa web • voz\n\nPode falar comigo, meu Rei."
                send.isEnabled = true; mic.isEnabled = recognizer != null; core.setReady(true)
            }
        } catch (e: Exception) {
            withContext(Dispatchers.Main) {
                status.text = "  •  NÚCLEO EM RECUPERAÇÃO"
                chat.text = "Falha ao preparar o cérebro local: ${e.message ?: "erro desconhecido"}"
                core.setReady(false)
            }
        }
    }

    private fun download(file: File) {
        val c = URL(MODEL_URL).openConnection() as HttpURLConnection
        c.connectTimeout = 30000; c.readTimeout = 180000; c.connect()
        if (c.responseCode !in 200..299) error("download HTTP ${c.responseCode}")
        val total = c.contentLengthLong
        c.inputStream.use { s -> file.outputStream().use { o ->
            val b = ByteArray(1024 * 1024); var d = 0L; var n: Int
            while (s.read(b).also { n = it } >= 0) {
                if (n == 0) continue
                o.write(b, 0, n); d += n
                if (total > 0 && d % (16L * 1024 * 1024) < n) runOnUiThread { status.text = "  •  BAIXANDO CÉREBRO ${d * 100 / total}%" }
            }
        }}
        c.disconnect()
    }

    private fun ask() {
        val q = input.text.toString().trim(); if (q.isEmpty() || busy) return
        input.setText(""); chat.append("\nVocê: $q\n"); busy = true; send.isEnabled = false; mic.isEnabled = false; core.setThinking(true)
        lifecycleScope.launch {
            try {
                val a = withContext(Dispatchers.IO) { answerFor(q) }
                chat.append("Evolution: $a\n")
                saveMemory(q, a)
                tts.speak(a, android.speech.tts.TextToSpeech.QUEUE_FLUSH, null, "evolution-answer")
            } catch (e: Exception) { chat.append("Evolution: não consegui concluir: ${e.message}\n") }
            busy = false; core.setThinking(false); send.isEnabled = true; mic.isEnabled = recognizer != null; status.text = "  •  CÉREBRO QWEN3-1.7B • LOCAL"
        }
    }

    private suspend fun answerFor(q: String): String {
        Calculator.tryCalculate(q)?.let { return it }
        val conversational = Regex("^(oi|olá|ola|bom dia|boa tarde|boa noite|obrigado|valeu|tudo bem)[!? .]*$", RegexOption.IGNORE_CASE).matches(q)
        val forceSearch = Regex("^pesquisar\\s+.+", RegexOption.IGNORE_CASE).matches(q)
        val research = !conversational && (forceSearch || (q.length >= 18 && (
            Regex("\\b(pesquise|pesquisa|procure|pesquisar|busque|buscar|atual|agora|hoje|notícia|noticias|últimas|último|última|preço atual|quanto está|fonte|fontes|recentemente)\\b", RegexOption.IGNORE_CASE).containsMatchIn(q) ||
            Regex("^(quem|qual|quais|o que|como|por que|porque|quando|onde)\\b", RegexOption.IGNORE_CASE).containsMatchIn(q))))
        val web = if (research) searchWeb(q.removePrefix("pesquisar ").trim()) else ""
        val mem = memory.getString("items", "").orEmpty().takeLast(10000)
        val prompt = buildString {
            append("MEMÓRIA RELEVANTE:\n").append(mem).append("\n\n")
            if (web.isNotBlank()) append("EVIDÊNCIAS DA INTERNET:\n").append(web.take(14000)).append("\n\n")
            append("TAREFA DO USUÁRIO:\n").append(q).append("\n\n")
            append("Resolva a tarefa com o máximo de competência. Verifique fatos, números e pressupostos antes da resposta. Se houver várias partes, cubra todas. Não invente.\n")
        }
        val model = Llama.loadModel(modelFile.absolutePath, LlamaConfig(contextSize = 2048, threads = 4))
        return try {
            val raw = Llama.complete(
                model,
                prompt = "<|im_start|>system\n$SYSTEM<|im_end|>\n<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n",
                systemPrompt = "",
                maxTokens = 384
            ).text.trim()
            cleanAnswer(raw)
        } finally { Llama.releaseModel(model) }
    }

    private fun cleanAnswer(raw: String): String {
        var s = raw.replace(Regex("<think>[\\s\\S]*?</think>"), "")
        s = s.replace("<|im_end|>", "").replace("<|endoftext|>", "").trim()
        return s.ifBlank { "Não consegui concluir a resposta agora." }
    }

    private fun searchWeb(query: String): String {
        val q = URLEncoder.encode(query, "UTF-8")
        val urls = listOf("https://www.google.com/search?q=$q&hl=pt-BR", "https://www.bing.com/search?q=$q&setlang=pt-BR")
        for (u in urls) try {
            val c = URL(u).openConnection() as HttpURLConnection
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Android) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36")
            c.connectTimeout = 10000; c.readTimeout = 15000
            val t = c.inputStream.bufferedReader().use { it.readText() }; c.disconnect()
            val clean = t.replace(Regex("<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>"), " ").replace(Regex("<[^>]+>"), " ").replace(Regex("\\s+"), " ")
            if (clean.length > 300) return clean.take(14000)
        } catch (_: Exception) {}
        return "A pesquisa web não retornou conteúdo acessível agora. Não diga que pesquisou se não houver evidência."
    }

    private fun saveMemory(q: String, a: String) {
        val old = memory.getString("items", "").orEmpty()
        memory.edit().putString("items", (old + "Usuário: $q\nEvolution: $a\n---\n").takeLast(20000)).apply()
    }

    override fun onDestroy() { recognizer?.destroy(); if (::tts.isInitialized) tts.shutdown(); if (::core.isInitialized) core.stop(); super.onDestroy() }
}

class EvolutionCoreView(context: android.content.Context) : View(context) {
    private val p = Paint(Paint.ANTI_ALIAS_FLAG)
    private val glow = Paint(Paint.ANTI_ALIAS_FLAG)
    private val tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 18)
    private var angle = 0f; private var ready = false; private var thinking = false; private var lastSound = 0L; private var running = true
    init { setLayerType(View.LAYER_TYPE_SOFTWARE, null); postInvalidateOnAnimation() }
    fun setReady(v: Boolean) { ready = v; invalidate() }
    fun setThinking(v: Boolean) { thinking = v; invalidate() }
    fun stop() { running = false; tone.release() }
    override fun onDraw(c: Canvas) {
        super.onDraw(c); if (!running) return
        val w = width.toFloat(); val h = height.toFloat(); val cx = w / 2f; val cy = h * .52f; val r = min(w, h) * .28f
        c.drawColor(Color.rgb(3, 6, 12))
        val grid = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(18, 70, 190, 255); strokeWidth = 1f }
        var x = 0f; while (x < w) { c.drawLine(x, 0f, x, h, grid); x += 34f }
        var y = 0f; while (y < h) { c.drawLine(0f, y, w, y, grid); y += 34f }
        angle = (angle + if (thinking) 1.15f else .56f) % 360f
        val coreR = r * (1f + sin(angle * PI / 180.0).toFloat() * .035f)
        glow.color = Color.argb(90, 20, 190, 255); glow.style = Paint.Style.FILL; glow.setShadowLayer(r * .65f, 0f, 0f, Color.argb(130, 40, 180, 255)); c.drawCircle(cx, cy, coreR * .72f, glow); glow.clearShadowLayer()
        for (i in 0..4) { p.style = Paint.Style.STROKE; p.strokeWidth = if (i == 0) 3f else 1.2f; p.color = when (i % 3) { 0 -> Color.argb(210, 73, 220, 255); 1 -> Color.argb(120, 150, 91, 255); else -> Color.argb(110, 255, 67, 193) }; val rr = coreR * (1.05f + i * .17f); val o = RectF(cx - rr, cy - rr * .72f, cx + rr, cy + rr * .72f); c.save(); c.rotate(angle * (if (i % 2 == 0) 1f else -.65f), cx, cy); c.drawOval(o, p); c.restore() }
        for (i in 0 until 18) { val a = Math.toRadians(angle * (.7 + i % 3 * .23) + i * 20.0); val rr = coreR * (1.08f + (i % 5) * .13f); p.style = Paint.Style.FILL; p.color = if (i % 3 == 0) Color.rgb(255, 74, 195) else Color.rgb(67, 220, 255); c.drawCircle(cx + cos(a).toFloat() * rr, cy + sin(a).toFloat() * rr * .72f, if (i % 4 == 0) 3.2f else 1.7f, p) }
        val g = RadialGradient(cx - coreR * .2f, cy - coreR * .22f, coreR, intArrayOf(Color.rgb(235, 255, 255), Color.rgb(70, 218, 255), Color.rgb(26, 69, 150), Color.rgb(6, 11, 28)), floatArrayOf(0f, .18f, .55f, 1f), Shader.TileMode.CLAMP); p.shader = g; p.style = Paint.Style.FILL; p.setShadowLayer(24f, 0f, 0f, Color.argb(180, 43, 198, 255)); c.drawCircle(cx, cy, coreR, p); p.clearShadowLayer(); p.shader = null
        val lp = 1f + sin(angle * PI / 180.0 * 1.8).toFloat() * .28f; val lr = coreR * .045f * lp
        val light = RadialGradient(cx, cy, coreR * .16f, intArrayOf(Color.WHITE, Color.rgb(120, 240, 255), Color.argb(30, 60, 180, 255), Color.TRANSPARENT), floatArrayOf(0f, .14f, .42f, 1f), Shader.TileMode.CLAMP); p.shader = light; c.drawCircle(cx, cy, coreR * .16f, p); p.shader = null; p.color = if (ready) Color.rgb(170, 250, 255) else Color.rgb(120, 145, 165); p.setShadowLayer(22f, 0f, 0f, p.color); c.drawCircle(cx, cy, lr, p); p.clearShadowLayer()
        p.textAlign = Paint.Align.CENTER; p.textSize = 10f; p.color = Color.rgb(100, 169, 196); c.drawText(if (thinking) "EVOLUTION • PROCESSANDO" else if (ready) "EVOLUTION • NÚCLEO ONLINE" else "EVOLUTION • INICIALIZANDO", cx, h - 16f, p); p.textSize = 8f; p.color = Color.rgb(64, 103, 126); c.drawText("LOCAL CORE / 60 FPS / CONNECTED LIGHT", cx, h - 4f, p)
        if (System.currentTimeMillis() - lastSound > 3000L) { lastSound = System.currentTimeMillis(); try { tone.startTone(ToneGenerator.TONE_PROP_BEEP, 28) } catch (_: Exception) {} }
        postInvalidateOnAnimation()
    }
}

object Calculator {
    fun tryCalculate(text: String): String? {
        val s = text.replace("quanto é", "", true).replace("calcule", "", true).trim()
        if (!Regex("^[0-9+*/().,%\\- xX÷]+$").matches(s)) return null
        return try { val v = Parser(s.replace("x", "*", true).replace("÷", "/").replace(",", ".")).parse(); "Resultado: $v" } catch (_: Exception) { null }
    }
    private class Parser(private val s: String) {
        var i = 0
        fun parse(): Double { val v = expr(); if (i < s.length) error("extra"); return v }
        fun expr(): Double { var v = term(); while (i < s.length && (s[i] == '+' || s[i] == '-')) { val o = s[i++]; val n = term(); v = if (o == '+') v + n else v - n }; return v }
        fun term(): Double { var v = factor(); while (i < s.length && (s[i] == '*' || s[i] == '/')) { val o = s[i++]; val n = factor(); v = if (o == '*') v * n else v / n }; return v }
        fun factor(): Double { while (i < s.length && s[i].isWhitespace()) i++; if (i < s.length && s[i] == '-') { i++; return -factor() }; if (i < s.length && s[i] == '(') { i++; val v = expr(); if (i >= s.length || s[i++] != ')') error("paren"); return v }; val st = i; while (i < s.length && (s[i].isDigit() || s[i] == '.')) i++; if (st == i) error("number"); return s.substring(st, i).toDouble() }
    }
}
