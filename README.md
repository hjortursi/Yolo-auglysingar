# 🎄 Jólaauglýsingavélin

Endalaus jólaauglýsingagenerator í anda íslenska útvarpssins. Þulur les upp jólakveðjur frá (tilbúnum) íslenskum fyrirtækjum yfir jólalegu stefi.

## Eiginleikar

- **AI-búnar auglýsingar**: Gemini 2.0 Flash skrifar jólakveðjurnar á íslensku
- **Talgerð**: ElevenLabs Text-to-Speech með multilingual v2 rödd
- **Jólastef**: ElevenLabs Sound Generation býr til jólalegt bakgrunnsstef
- **Fyndnistig**: Slider frá 1-10 sem stýrir hversu fyndnar/absúrðar auglýsingarnar eru
- **Endalaus spilun**: Ýttu á play og hlustaðu á endalausar jólakveðjur

## Uppsetning

### 1. Klóna verkefnið

```bash
git clone <repo-url>
cd Yolo-auglysingar
```

### 2. Setja upp API lykla

Afritaðu `.env.example` í `.env` og fylltu inn API lyklana:

```bash
cp .env.example .env
```

Þú þarft:
- **Gemini API lykil**: Sæktu á [Google AI Studio](https://makersuite.google.com/app/apikey)
- **ElevenLabs API lykil**: Sæktu á [ElevenLabs](https://elevenlabs.io) (Settings → API Key)

### 3. Setja upp dependencies

```bash
npm install
```

### 4. Keyra þjóninn

```bash
npm start
```

Opnaðu síðan `http://localhost:3000` í vafranum.

## Notkun

1. **Ýttu á Play** - Jólakveðjurnar byrja
2. **Stilltu fyndnistigið** - Færðu sleðann til að stýra hversu fyndnar auglýsingarnar eru:
   - 1-3: Hefðbundnar, alvarlegar kveðjur
   - 4-6: Smá húmor og orðaleikur
   - 7-8: Fyndið með ýkjum
   - 9-10: Brjálað og absúrt!
3. **Njóttu** - Þulurinn les endalaust upp jólakveðjur

## Tækni

- **Backend**: Node.js + Express
- **AI Text**: Google Gemini 2.0 Flash
- **TTS**: ElevenLabs Multilingual v2
- **Music**: ElevenLabs Sound Generation
- **Frontend**: Vanilla HTML/CSS/JS

## Um verkefnið

Þetta verkefni er innblásið af íslensku útvarpshefðinni þar sem þulur les upp stuttar jólakveðjur frá fyrirtækjum yfir jólalegu stefi á Rás 1 og Rás 2 á jólunum.

---

🎅 Gleðileg jól og farsælt komandi ár!
