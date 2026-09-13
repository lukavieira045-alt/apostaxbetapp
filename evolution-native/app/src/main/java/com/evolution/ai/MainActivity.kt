package com.evolution.ai

import android.graphics.*
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.content.Intent
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
    private var brainBusy = false
    private var recognizer: SpeechRecognizer? = null
    private val memory by lazy { getSharedPreferences("evolution_memory", MODE_PRIVATE) }

    companion object {
        private const val MODEL_URL = "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_0.gguf?download=true"
        private const val MODEL_NAME = "qwen2.5-0.5b-instruct-q4_0.gguf"
        private const val SYSTEM = """
Você é EVOLUTION, uma inteligência artificial local, direta, natural e extremamente cuidadosa.
Você roda no aparelho do usuário e não depende de API paga. Responda em português do Brasil, salvo se o usuário pedir outro idioma.
Seu objetivo é resolver o problema, não apenas conversar.
Interprete o pedido antes de responder. Use memória, matemática e pesquisa web quando necessário. Confira a resposta antes de entregá-la.
Nunca invente fatos, pesquisa, execução de código ou acesso a dados.
Quando houver resultados da internet, use-os como evidência e deixe claro quando algo não pôde ser confirmado.
Quando o usuário pedir programação, entregue uma solução prática. Quando pedir matemática, calcule com cuidado.
Pode chamar o dono naturalmente de "meu Rei" ou "chefe" quando combinar com a conversa, sem exagerar.
Não revele raciocínio interno privado; entregue conclusão, verificações e passos úteis.
"""
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val title = TextView(this).apply { text = "EVOLUTION"; textSize = 23f; typeface = Typeface.DEFAULT_BOLD; setTextColor(Color.WHITE) }
        status = TextView(this).apply { text = "  •  NÚCLEO LOCAL"; textSize = 11f; setTextColor(Color.rgb(92,225,255)); setPadding(10,0,0,0) }
        header.addView(title); header.addView(status); root.addView(header)

        core = EvolutionCoreView(this)
        root.addView(core, LinearLayout.LayoutParams(-1, 0, 0.46f))

        chat = TextView(this).apply {
            textSize = 15f; setTextColor(Color.rgb(229,242,255)); setPadding(12,10,12,10)
            text = "EVOLUTION\nPreparando o cérebro local..."
            setBackgroundColor(Color.rgb(7,12,22))
        }
        val scroll = ScrollView(this).apply { addView(chat); setBackgroundColor(Color.rgb(7,12,22)) }
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 0.31f))

        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(0,7,0,0) }
        input = EditText(this).apply {
            hint = "Converse com a Evolution..."; setHintTextColor(Color.rgb(95,112,135)); setTextColor(Color.WHITE)
            minLines = 2; setSingleLine(false); setBackgroundColor(Color.rgb(11,18,31)); setPadding(15,9,15,9)
        }
        mic = Button(this).apply { text = "🎙"; textSize = 18f; setTextColor(Color.WHITE); setOnClickListener { startListening() } }
        send = Button(this).apply { text = "➤"; textSize = 21f; isEnabled = false; setTextColor(Color.WHITE); setOnClickListener { ask() } }
        controls.addView(input, LinearLayout.LayoutParams(0,-2,1f)); controls.addView(mic, LinearLayout.LayoutParams(58,58)); controls.addView(send, LinearLayout.LayoutParams(58,58)); root.addView(controls)

        val footer = TextView(this).apply { text = "NÚCLEO LOCAL  •  VOZ  •  MEMÓRIA  •  MATEMÁTICA  •  PESQUISA WEB"; textSize = 9f; gravity = Gravity.CENTER; setTextColor(Color.rgb(91,125,153)); setPadding(0,7,0,0) }
        root.addView(footer); setContentView(root)
    }

    private fun setupSpeech() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { mic.isEnabled = false; return }
        recognizer = SpeechRecognizer.createSpeechRecognizer(this)
        recognizer?.setRecognitionListener(object : android.speech.RecognitionListener {
            override fun onReadyForSpeech(p: Bundle?) { status.text = "  •  OUVINDO" }
            override fun onBeginningOfSpeech() { status.text = "  •  OUVINDO" }
            override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onEndOfSpeech() { status.text = "  •  PROCESSANDO VOZ" }
            override fun onError(e: Int) { status.text = if (brainBusy) "  •  PROCESSANDO" else "  •  CÉREBRO PRONTO • LOCAL" }
            override fun onResults(results: Bundle) {
                val text = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                if (text.isNotBlank()) { input.setText(text); input.setSelection(text.length); ask() }
            }
            override fun onPartialResults(p: Bundle?) {}
            override fun onEvent(t: Int, p: Bundle?) {}
        })
    }

    private fun startListening() {
        if (brainBusy) return
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        }
        recognizer?.startListening(intent)
    }

    private suspend fun prepareBrain() = withContext(Dispatchers.IO) {
        try {
            val dir = File(getExternalFilesDir("models"), "").apply { mkdirs() }
            modelFile = File(dir, MODEL_NAME)
            if (!modelFile.exists() || modelFile.length() < 100_000_000) downloadModel(modelFile)
            withContext(Dispatchers.Main) {
                status.text = "  •  CÉREBRO PRONTO • LOCAL"
                chat.text = "EVOLUTION ONLINE\n\nCérebro local carregado. Posso conversar, ouvir sua voz, fazer matemática, guardar memória e pesquisar na internet quando a pergunta precisar de informação atual.\n\nPode falar comigo, meu Rei."
                send.isEnabled = true; mic.isEnabled = recognizer != null; core.setReady(true)
            }
        } catch (e: Exception) {
            withContext(Dispatchers.Main) { status.text = "  •  NÚCLEO EM RECUPERAÇÃO"; chat.text = "Não consegui preparar o cérebro: ${e.message ?: "erro desconhecido"}"; core.setReady(false) }
        }
    }

    private fun downloadModel(file: File) {
        val conn = URL(MODEL_URL).openConnection() as HttpURLConnection
        conn.connectTimeout = 30000; conn.readTimeout = 120000; conn.requestMethod = "GET"; conn.connect()
        if (conn.responseCode !in 200..299) error("download HTTP ${conn.responseCode}")
        val total = conn.contentLengthLong
        conn.inputStream.use { input -> file.outputStream().use { output ->
            val buffer = ByteArray(1024 * 1024); var done = 0L; var n: Int
            while (input.read(buffer).also { n = it } >= 0) { if (n == 0) continue; output.write(buffer,0,n); done += n; if (total > 0 && done % (8L*1024*1024) < n) runOnUiThread { status.text = "  •  BAIXANDO CÉREBRO ${done*100/total}%" } }
        }}
        conn.disconnect()
    }

    private fun ask() {
        val q = input.text.toString().trim(); if (q.isEmpty() || brainBusy) return
        input.setText(""); append("\nVocê: $q\n"); brainBusy = true; send.isEnabled = false; mic.isEnabled = false; core.setThinking(true)
        lifecycleScope.launch {
            try {
                val answer = withContext(Dispatchers.IO) { answerFor(q) }
                append("Evolution: $answer\n")
                saveMemory(q, answer)
                tts.speak(answer, android.speech.tts.TextToSpeech.QUEUE_FLUSH, null, "evolution-answer")
            } catch (e: Exception) { append("Evolution: não consegui concluir esta resposta: ${e.message}\n") }
            brainBusy = false; core.setThinking(false); send.isEnabled = true; mic.isEnabled = recognizer != null; status.text = "  •  CÉREBRO PRONTO • LOCAL"
        }
    }

    private fun answerFor(q: String): String {
        val math = Calculator.tryCalculate(q); if (math != null) return math
        val needsResearch = Regex("\\b(pesquise|pesquisa|procure|pesquisar|busque|buscar|atual|agora|hoje|notícia|noticias|últimas|último|última|quem é o atual|preço atual|quanto está)\\b", RegexOption.IGNORE_CASE).containsMatchIn(q)
        val web = if (needsResearch) searchWeb(q) else ""
        val memories = memory.getString("items", "")?.takeLast(6000).orEmpty()
        val prompt = buildString {
            append("Memórias do usuário:\n").append(memories).append("\n\n")
            if (web.isNotBlank()) append("EVIDÊNCIAS DA INTERNET:\n").append(web.take(9000)).append("\n\n")
            append("USUÁRIO:\n").append(q).append("\nASSISTENTE:")
        }
        val model = Llama.loadModel(modelFile.absolutePath, LlamaConfig(contextSize = 1536, threads = 2))
        return try {
            val result = Llama.complete(model, prompt = "<|im_start|>system\n$SYSTEM<|im_end|>\n<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n", systemPrompt = "", maxTokens = 320)
            result.text.trim().replace("<|im_end|>", "").trim().ifBlank { "Não consegui gerar uma resposta agora." }
        } finally { Llama.releaseModel(model) }
    }

    private fun searchWeb(query: String): String {
        val q = URLEncoder.encode(query, "UTF-8")
        val urls = listOf("https://www.google.com/search?q=$q&hl=pt-BR", "https://www.bing.com/search?q=$q&setlang=pt-BR")
        for (u in urls) try {
            val c = URL(u).openConnection() as HttpURLConnection
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Android) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36")
            c.connectTimeout = 10000; c.readTimeout = 15000
            val text = c.inputStream.bufferedReader().use { it.readText() }; c.disconnect()
            val clean = text.replace(Regex("<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>"), " ").replace(Regex("<[^>]+>"), " ").replace(Regex("\\s+"), " ")
            if (clean.length > 300) return clean.take(12000)
        } catch (_: Exception) {}
        return "A pesquisa web não retornou conteúdo acessível agora. Não diga que pesquisou se não houver evidência."
    }

    private fun saveMemory(q: String, a: String) { val old = memory.getString("items", "").orEmpty(); memory.edit().putString("items", (old + "Usuário: $q\nEvolution: $a\n---\n").takeLast(20000)).apply() }
    private fun append(s: String) { chat.append(s) }
    override fun onDestroy() { recognizer?.destroy(); if (::tts.isInitialized) tts.shutdown(); if (::core.isInitialized) core.stop(); super.onDestroy() }
}

class EvolutionCoreView(context: android.content.Context) : View(context) {
    private val p = Paint(Paint.ANTI_ALIAS_FLAG); private val glow = Paint(Paint.ANTI_ALIAS_FLAG); private val tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 18)
    private var angle = 0f; private var ready = false; private var thinking = false; private var lastSound = 0L; private var running = true
    init { setLayerType(View.LAYER_TYPE_SOFTWARE, null); postInvalidateOnAnimation() }
    fun setReady(v: Boolean) { ready=v; invalidate() }; fun setThinking(v: Boolean) { thinking=v; invalidate() }; fun stop(){ running=false; tone.release() }
    override fun onDraw(c: Canvas) {
        super.onDraw(c); if (!running) return
        val w=width.toFloat(); val h=height.toFloat(); val cx=w/2f; val cy=h*.52f; val r=min(w,h)*.28f; c.drawColor(Color.rgb(3,6,12))
        val grid=Paint(Paint.ANTI_ALIAS_FLAG).apply{color=Color.argb(18,70,190,255);strokeWidth=1f}; var gx=0f; while(gx<w){c.drawLine(gx,0f,gx,h,grid);gx+=34f}; var gy=0f; while(gy<h){c.drawLine(0f,gy,w,gy,grid);gy+=34f}
        angle=(angle+if(thinking)1.15f else .56f)%360f; val pulse=1f+sin(angle*PI/180.0).toFloat()*.035f; val coreR=r*pulse
        glow.color=Color.argb(90,20,190,255); glow.style=Paint.Style.FILL; glow.setShadowLayer(r*.65f,0f,0f,Color.argb(130,40,180,255)); c.drawCircle(cx,cy,coreR*.72f,glow); glow.clearShadowLayer()
        for(i in 0..4){p.style=Paint.Style.STROKE;p.strokeWidth=if(i==0)3f else 1.2f;p.color=when(i%3){0->Color.argb(210,73,220,255);1->Color.argb(120,150,91,255);else->Color.argb(110,255,67,193)};val rr=coreR*(1.05f+i*.17f);val oval=RectF(cx-rr,cy-rr*.72f,cx+rr,cy+rr*.72f);c.save();c.rotate(angle*(if(i%2==0)1f else-.65f),cx,cy);c.drawOval(oval,p);c.restore()}
        for(i in 0 until 18){val a=Math.toRadians(angle*(.7+i%3*.23)+i*20.0);val rr=coreR*(1.08f+(i%5)*.13f);val x=cx+cos(a).toFloat()*rr;val y=cy+sin(a).toFloat()*rr*.72f;p.style=Paint.Style.FILL;p.color=if(i%3==0)Color.rgb(255,74,195) else Color.rgb(67,220,255);c.drawCircle(x,y,if(i%4==0)3.2f else 1.7f,p)}
        val grad=RadialGradient(cx-coreR*.2f,cy-coreR*.22f,coreR,intArrayOf(Color.rgb(235,255,255),Color.rgb(70,218,255),Color.rgb(26,69,150),Color.rgb(6,11,28)),floatArrayOf(0f,.18f,.55f,1f),Shader.TileMode.CLAMP);p.shader=grad;p.style=Paint.Style.FILL;p.setShadowLayer(24f,0f,0f,Color.argb(180,43,198,255));c.drawCircle(cx,cy,coreR,p);p.clearShadowLayer();p.shader=null
        // Central eye removed: the nucleus now has only a small connected pulsing light.
        val lightPulse=1f+sin(angle*PI/180.0*1.8).toFloat()*.28f; val lr=coreR*.045f*lightPulse
        val light=RadialGradient(cx,cy,coreR*.16f,intArrayOf(Color.WHITE,Color.rgb(120,240,255),Color.argb(30,60,180,255),Color.TRANSPARENT),floatArrayOf(0f,.14f,.42f,1f),Shader.TileMode.CLAMP);p.shader=light;p.style=Paint.Style.FILL;c.drawCircle(cx,cy,coreR*.16f,p);p.shader=null
        p.style=Paint.Style.FILL;p.color=if(ready)Color.rgb(170,250,255) else Color.rgb(120,145,165);p.setShadowLayer(22f,0f,0f,p.color);c.drawCircle(cx,cy,lr,p);p.clearShadowLayer()
        p.textAlign=Paint.Align.CENTER;p.textSize=10f;p.color=Color.rgb(100,169,196);c.drawText(if(thinking)"EVOLUTION • PROCESSANDO" else if(ready)"EVOLUTION • NÚCLEO ONLINE" else "EVOLUTION • INICIALIZANDO",cx,h-16f,p);p.textSize=8f;p.color=Color.rgb(64,103,126);c.drawText("LOCAL CORE  /  60 FPS  /  CONNECTED LIGHT",cx,h-4f,p)
        if(System.currentTimeMillis()-lastSound>3000L){lastSound=System.currentTimeMillis();try{tone.startTone(ToneGenerator.TONE_PROP_BEEP,28)}catch(_:Exception){}};postInvalidateOnAnimation()
    }
}

object Calculator {
    fun tryCalculate(text:String):String?{val candidate=text.replace("quanto é","",true).replace("calcule","",true).trim();if(!Regex("^[0-9+*/().,%\\- xX÷]+$").matches(candidate))return null;return try{val value=Parser(candidate.replace("x","*",true).replace("÷","/").replace(",",".")).parse();"Resultado: $value"}catch(_:Exception){null}}
    private class Parser(private val s:String){var i=0;fun parse():Double{val v=expr();if(i<s.length)error("extra");return v};fun expr():Double{var v=term();while(i<s.length&&(s[i]=='+'||s[i]=='-')){val op=s[i++];val n=term();v=if(op=='+')v+n else v-n};return v};fun term():Double{var v=factor();while(i<s.length&&(s[i]=='*'||s[i]=='/')){val op=s[i++];val n=factor();v=if(op=='*')v*n else v/n};return v};fun factor():Double{while(i<s.length&&s[i].isWhitespace())i++;if(i<s.length&&s[i]=='-'){i++;return-factor()};if(i<s.length&&s[i]=='('){i++;val v=expr();if(i>=s.length||s[i++]!=')')error("paren");return v};val st=i;while(i<s.length&&(s[i].isDigit()||s[i]=='.'))i++;if(st==i)error("number");return s.substring(st,i).toDouble()}}
}
