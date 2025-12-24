// DOM Elements
const playButton = document.getElementById('playButton');
const playIcon = document.getElementById('playIcon');
const funnySlider = document.getElementById('funnySlider');
const funnyValue = document.getElementById('funnyValue');
const adText = document.getElementById('adText');
const companyName = document.getElementById('companyName');
const statusText = document.getElementById('statusText');
const loadingBar = document.getElementById('loadingBar');
const visualizer = document.getElementById('visualizer');
const liveIndicator = document.getElementById('liveIndicator');
const adCountEl = document.getElementById('adCount');
const companyCountEl = document.getElementById('companyCount');
const snowfall = document.getElementById('snowfall');
const radioDisplay = document.querySelector('.radio-display');

// Audio elements
const jingleAudio = document.getElementById('jingleAudio');
const speechAudio = document.getElementById('speechAudio');

// State
let isPlaying = false;
let adCount = 0;
let companiesSet = new Set();
let jingleLoaded = false;
let currentAbortController = null;

// Initialize snowfall
function createSnowflakes() {
  const snowflakeChars = ['❄', '❅', '❆', '✻', '✼', '❉'];
  for (let i = 0; i < 50; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
    snowflake.style.left = Math.random() * 100 + '%';
    snowflake.style.animationDuration = (Math.random() * 5 + 5) + 's';
    snowflake.style.animationDelay = Math.random() * 10 + 's';
    snowflake.style.fontSize = (Math.random() * 0.5 + 0.5) + 'rem';
    snowflake.style.opacity = Math.random() * 0.5 + 0.3;
    snowfall.appendChild(snowflake);
  }
}

createSnowflakes();

// Update slider value display
funnySlider.addEventListener('input', (e) => {
  funnyValue.textContent = e.target.value;

  // Update emojis based on value
  const emojiLeft = document.getElementById('emojiLeft');
  const emojiRight = document.getElementById('emojiRight');
  const val = parseInt(e.target.value);

  if (val <= 3) {
    emojiLeft.textContent = '🎄';
    emojiRight.textContent = '😊';
  } else if (val <= 6) {
    emojiLeft.textContent = '😊';
    emojiRight.textContent = '😄';
  } else if (val <= 8) {
    emojiLeft.textContent = '😄';
    emojiRight.textContent = '🤣';
  } else {
    emojiLeft.textContent = '🤣';
    emojiRight.textContent = '🤯';
  }
});

// Play button click handler
playButton.addEventListener('click', togglePlay);

async function togglePlay() {
  if (isPlaying) {
    stopPlaying();
  } else {
    startPlaying();
  }
}

function startPlaying() {
  isPlaying = true;
  playButton.classList.add('playing');
  playIcon.textContent = '⏸';
  liveIndicator.classList.add('active');
  visualizer.classList.add('active');
  radioDisplay.classList.add('active');

  // Start the ad generation loop
  generateAndPlayAd();
}

function stopPlaying() {
  isPlaying = false;
  playButton.classList.remove('playing');
  playIcon.textContent = '▶';
  liveIndicator.classList.remove('active');
  visualizer.classList.remove('active');
  radioDisplay.classList.remove('active');

  // Stop audio
  jingleAudio.pause();
  speechAudio.pause();

  // Cancel any pending requests
  if (currentAbortController) {
    currentAbortController.abort();
  }

  setStatus('Í pásu - ýttu á play til að halda áfram');
  loadingBar.classList.remove('active');
}

async function generateAndPlayAd() {
  if (!isPlaying) return;

  try {
    // Step 1: Load jingle if not loaded
    if (!jingleLoaded) {
      setStatus('Hleð jólastefinu...', true);
      await loadJingle();
    }

    // Start playing jingle in background (loop)
    if (jingleAudio.paused) {
      jingleAudio.volume = 0.3;
      jingleAudio.play().catch(e => console.log('Jingle play error:', e));
    }

    // Step 2: Generate ad text
    setStatus('Bý til auglýsingu með Gemini...', true);
    const adData = await generateAdText();

    if (!isPlaying) return;

    // Display the ad text
    adText.textContent = adData.adText;
    companyName.textContent = `— ${adData.companyName}`;

    // Update stats
    adCount++;
    companiesSet.add(adData.companyName);
    adCountEl.textContent = adCount;
    companyCountEl.textContent = companiesSet.size;

    // Step 3: Generate speech
    setStatus('Þulur les upp auglýsinguna...', true);

    // Lower jingle volume during speech
    jingleAudio.volume = 0.15;

    await generateAndPlaySpeech(adData.adText);

    if (!isPlaying) return;

    // Raise jingle volume back up
    jingleAudio.volume = 0.3;

    // Wait a moment before next ad
    setStatus('Undirbý næstu auglýsingu...', false);
    await sleep(2000);

    // Generate next ad
    if (isPlaying) {
      generateAndPlayAd();
    }

  } catch (error) {
    console.error('Error in ad generation:', error);
    if (isPlaying) {
      setStatus(`Villa: ${error.message}. Reyni aftur...`, false);
      await sleep(3000);
      if (isPlaying) {
        generateAndPlayAd();
      }
    }
  }
}

async function loadJingle() {
  try {
    const response = await fetch('/api/generate-jingle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Gat ekki búið til jólastef');
    }

    const blob = await response.blob();
    jingleAudio.src = URL.createObjectURL(blob);
    jingleLoaded = true;

  } catch (error) {
    console.error('Jingle load error:', error);
    // Use a fallback - just continue without jingle
    jingleLoaded = true;
  }
}

async function generateAdText() {
  const funnyLevel = parseInt(funnySlider.value);

  const response = await fetch('/api/generate-ad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ funnyLevel })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gat ekki búið til auglýsingu');
  }

  return response.json();
}

async function generateAndPlaySpeech(text) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Gat ekki búið til tal');
      }

      const blob = await response.blob();
      speechAudio.src = URL.createObjectURL(blob);

      speechAudio.onended = () => resolve();
      speechAudio.onerror = (e) => reject(new Error('Villa við afspilun'));

      speechAudio.play();
      setStatus('🎙️ Þulur talar...', false);

    } catch (error) {
      reject(error);
    }
  });
}

function setStatus(message, showLoading = false) {
  statusText.textContent = message;
  if (showLoading) {
    loadingBar.classList.add('active');
  } else {
    loadingBar.classList.remove('active');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle page visibility - pause when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden && isPlaying) {
    // Optionally pause when tab is hidden to save resources
    // stopPlaying();
  }
});

// Keyboard shortcut - Space to play/pause
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    togglePlay();
  }
});

// Initialize
setStatus('Tilbúið - ýttu á play eða bilslá (space) til að hefja');
