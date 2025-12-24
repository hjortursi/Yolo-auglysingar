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

// Pre-generation buffer
const BUFFER_SIZE = 4;
const adBuffer = []; // Array of { adData, audioBlob }
let isGenerating = false;
let isPlayingAd = false;

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

async function startPlaying() {
  isPlaying = true;
  playButton.classList.add('playing');
  playIcon.textContent = '⏸';
  liveIndicator.classList.add('active');
  visualizer.classList.add('active');
  radioDisplay.classList.add('active');

  // Load jingle first (only once)
  if (!jingleLoaded) {
    setStatus('Hleð jólastefinu...', true);
    await loadJingle();
  }

  // Start jingle
  if (jingleAudio.src && jingleAudio.paused) {
    jingleAudio.volume = 0.3;
    jingleAudio.play().catch(e => console.log('Jingle play error:', e));
  }

  // Start filling the buffer
  fillBuffer();

  // Start playing ads from buffer
  playNextAd();
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

  setStatus(`Í pásu - ${adBuffer.length} auglýsingar í biðröð`);
  loadingBar.classList.remove('active');
}

// Fill the buffer with pre-generated ads
async function fillBuffer() {
  // Don't start multiple fill operations
  if (isGenerating) return;

  while (isPlaying && adBuffer.length < BUFFER_SIZE) {
    isGenerating = true;
    updateBufferStatus();

    try {
      // Generate ad text
      const adData = await generateAdText();

      if (!isPlaying) break;

      // Generate speech audio
      const audioBlob = await generateSpeechBlob(adData.adText);

      if (!isPlaying) break;

      // Add to buffer
      adBuffer.push({ adData, audioBlob });
      updateBufferStatus();

      console.log(`Buffer: ${adBuffer.length}/${BUFFER_SIZE} auglýsingar tilbúnar`);

    } catch (error) {
      console.error('Error pre-generating ad:', error);
      // Wait a bit before retrying on error
      await sleep(2000);
    }
  }

  isGenerating = false;
}

// Play the next ad from the buffer
async function playNextAd() {
  if (!isPlaying) return;

  // Wait for buffer to have content
  if (adBuffer.length === 0) {
    setStatus('Bý til auglýsingar...', true);
    await waitForBuffer();
  }

  if (!isPlaying) return;

  // Get next ad from buffer
  const { adData, audioBlob } = adBuffer.shift();

  // Trigger buffer refill in background
  fillBuffer();

  // Display the ad
  adText.textContent = adData.adText;
  companyName.textContent = `— ${adData.companyName}`;

  // Update stats
  adCount++;
  companiesSet.add(adData.companyName);
  adCountEl.textContent = adCount;
  companyCountEl.textContent = companiesSet.size;

  // Play the speech
  setStatus(`🎙️ Þulur talar... (${adBuffer.length} í biðröð)`, false);

  // Lower jingle volume during speech
  jingleAudio.volume = 0.15;

  await playAudioBlob(audioBlob);

  if (!isPlaying) return;

  // Raise jingle volume back
  jingleAudio.volume = 0.3;

  // Brief pause between ads
  await sleep(1500);

  // Play next ad
  if (isPlaying) {
    playNextAd();
  }
}

// Wait for buffer to have at least one item
async function waitForBuffer() {
  while (adBuffer.length === 0 && isPlaying) {
    await sleep(100);
  }
}

// Update status with buffer info
function updateBufferStatus() {
  if (!isPlayingAd) {
    if (adBuffer.length === 0) {
      setStatus('Bý til auglýsingar...', true);
    } else if (adBuffer.length < BUFFER_SIZE) {
      setStatus(`Hleð auglýsingum... (${adBuffer.length}/${BUFFER_SIZE})`, true);
    } else {
      setStatus(`${adBuffer.length} auglýsingar tilbúnar`, false);
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
    // Continue without jingle
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

// Generate speech and return blob (don't play yet)
async function generateSpeechBlob(text) {
  const response = await fetch('/api/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error('Gat ekki búið til tal');
  }

  return response.blob();
}

// Play an audio blob
function playAudioBlob(blob) {
  return new Promise((resolve, reject) => {
    speechAudio.src = URL.createObjectURL(blob);

    speechAudio.onended = () => {
      URL.revokeObjectURL(speechAudio.src);
      resolve();
    };

    speechAudio.onerror = (e) => {
      URL.revokeObjectURL(speechAudio.src);
      reject(new Error('Villa við afspilun'));
    };

    speechAudio.play().catch(reject);
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

// Keyboard shortcut - Space to play/pause
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    togglePlay();
  }
});

// Initialize
setStatus('Tilbúið - ýttu á play eða bilslá (space) til að hefja');
