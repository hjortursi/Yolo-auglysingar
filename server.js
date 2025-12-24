const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Icelandic company names and types for variety
const companyTypes = [
  'Verslunin', 'Bakaríið', 'Veitingastaðurinn', 'Verkstæðið', 'Hárgreiðslustofan',
  'Sjoppa', 'Bensínstöðin', 'Bókabúðin', 'Blómaverslunin', 'Tannlæknastofan',
  'Rafmagnsverktakinn', 'Pípulagningafyrirtækið', 'Ferðaskrifstofan', 'Tryggingafélagið',
  'Fjármálafyrirtækið', 'Fasteignasalan', 'Heilsuverslunin', 'Íþróttavöruverslunin',
  'Leikfangabúðin', 'Tölvuverslunin', 'Ljósmyndarinn', 'Hundaverslunin',
  'Veiðivöruverslunin', 'Garðyrkjufyrirtækið', 'Húsgagnaverslunin'
];

const locations = [
  'Akureyri', 'Ísafjörður', 'Egilsstaðir', 'Selfoss', 'Reykjanesbær',
  'Vestmannaeyjar', 'Húsavík', 'Siglufjörður', 'Höfn', 'Blönduós',
  'Stykkishólmur', 'Sauðárkrókur', 'Dalvík', 'Hella', 'Vík',
  'Laugarvatn', 'Borgarnes', 'Reyðarfjörður', 'Seyðisfjörður', 'Ólafsfjörður'
];

const firstNames = [
  'Jón', 'Guðmundur', 'Sigurður', 'Gunnar', 'Ólafur', 'Magnús', 'Einar', 'Kristján',
  'Björn', 'Halldór', 'Anna', 'Guðrún', 'Kristín', 'Sigríður', 'Margrét', 'Helga',
  'Sigrún', 'Ingibjörg', 'Jóhanna', 'Katrín', 'Þór', 'Freyr', 'Baldur', 'Ragnar'
];

// Generate ad text using Gemini
app.post('/api/generate-ad', async (req, res) => {
  try {
    const { funnyLevel = 5 } = req.body; // 1-10 scale

    // Random company generation
    const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const ownerName = firstNames[Math.floor(Math.random() * firstNames.length)];

    // Generate a quirky company name
    const companyNameOptions = [
      `${companyType} ${ownerName}s`,
      `${ownerName}s ${companyType}`,
      `${companyType} á ${location}`,
      `${location}s ${companyType}`,
      `${ownerName} og félagar`
    ];
    const companyName = companyNameOptions[Math.floor(Math.random() * companyNameOptions.length)];

    let funnyInstructions = '';
    if (funnyLevel <= 3) {
      funnyInstructions = 'Skrifaðu hefðbundna, hátíðlega jólakveðju. Haltu þessu einlægt og hlýtt.';
    } else if (funnyLevel <= 6) {
      funnyInstructions = 'Bættu smá húmor við jólakveðjuna. Notaðu orðaleik eða létta brandara sem hæfa fyrirtækinu.';
    } else if (funnyLevel <= 8) {
      funnyInstructions = 'Gerðu jólakveðjuna fyndna með ýkjum, óraunhæfum loforðum, eða skrítnum tilvísunum í vörur fyrirtækisins.';
    } else {
      funnyInstructions = 'Gerðu þetta MJÖG fyndið og absúrd! Notaðu galna ýkjur, óraunhæfar fullyrðingar og skopstælingar. Þetta má vera "chaotic" en samt einhvern veginn hátíðlegt.';
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Þú ert klassískur íslenskur þulur á útvarpsstöð sem les upp jólakveðjur frá fyrirtækjum á Íslandi.

Fyrirtækið sem sendir kveðju núna er: "${companyName}"
Tegund fyrirtækis: ${companyType}
Staðsetning: ${location}

${funnyInstructions}

Skrifaðu stutta jólakveðju (2-4 setningar) sem þulur myndi lesa upp á rás 1 eða rás 2 í desember.
Byrjaðu á að kynna fyrirtækið og endaðu á "Gleðileg jól!" eða álíka.
Hafðu íslenskan tón - hlýtt, gestrisið, með smá gamansemi.

MIKILVÆGT: Svaraðu AÐEINS með texta kveðjunnar, engin önnur útskýring.`;

    const result = await model.generateContent(prompt);
    const adText = result.response.text().trim();

    res.json({
      success: true,
      adText,
      companyName,
      location
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      success: false,
      error: 'Villa við að búa til auglýsingu',
      details: error.message
    });
  }
});

// Text-to-Speech using ElevenLabs
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      success: false,
      error: 'Villa við talgervingu',
      details: error.message
    });
  }
});

// Generate Christmas jingle using ElevenLabs Sound Effects
app.post('/api/generate-jingle', async (req, res) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: 'Gentle Christmas music with soft bells, warm synthesizer, and festive melody. Cozy Scandinavian holiday atmosphere, perfect for radio advertisement background. Loopable, 15 seconds.',
        duration_seconds: 15,
        prompt_influence: 0.5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs Sound Generation error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Jingle generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Villa við að búa til jólastef',
      details: error.message
    });
  }
});

// Get available ElevenLabs voices (for potential voice selection feature)
app.get('/api/voices', async (req, res) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Voices fetch error:', error);
    res.status(500).json({ error: 'Villa við að sækja raddir' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎄 Jólaauglýsingavélin keyrir á http://localhost:${PORT}`);
  console.log('   Gleðileg jól og farsældar á nýju ári!');
});
