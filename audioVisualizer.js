const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioElement = document.getElementById('audioPlayer');
const canvas = document.getElementById('audioVisualizer');
const canvasContext = canvas.getContext('2d');
canvasContext.imageSmoothingEnabled = false;
canvas.style.imageRendering = 'pixelated';

// Playlists logic
let dayPlaylistFiles = [
  'audio/dayHaoOliCity.mp3', 'audio/dayHeaHeaCity.mp3', 'audio/dayIkiTown.mp3', 'audio/daySeafolkVillage.mp3', 'audio/ancientPoinPath.mp3', 'audio/hallOfFame.mp3', 'audio/lillesRespove.mp3', 'audio/livelyLillie.mp3', 'audio/mantineSurf.mp3', 'audio/mysteryGift.mp3', 'audio/route1.mp3', 'audio/solgaleoLunala.mp3'
];
let nightPlaylistFiles = [
  'audio/nightHaoOliCity.mp3', 'audio/nightHeaHeaCity.mp3', 'audio/nightIkiTown.mp3', 'audio/nightMalieCity.mp3', 'audio/nightSeafolkVillage.mp3', 'audio/welcomeBack.mp3', 'audio/myHome.mp3', 'audio/motherAndDaughter.mp3'
];
dayPlaylistFiles.sort(() => Math.random() - 0.5);
nightPlaylistFiles.sort(() => Math.random() - 0.5);

const now = new Date();
const currentHour = now.getHours();
const playlist = currentHour > 6 && currentHour < 20 ? dayPlaylistFiles : nightPlaylistFiles;

// Analyzer config
const barCount = 128;
const barSpacing = 1;
const fftSize = 1024;

const threshold = 0;
const sizeScale = 2;

const skippedBars = 32;

const analyser = audioContext.createAnalyser();
analyser.fftSize = fftSize;
analyser.smoothingTimeConstant = 0.935;

const source = audioContext.createMediaElementSource(audioElement);
source.connect(analyser);
analyser.connect(audioContext.destination);

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function getLogIndex(i, numBars, bufferLength, minBin = 4, logStrength = 0.9) {
  // Linear component
  const linearIndex = minBin + (bufferLength - minBin) * (i / numBars);
  
  // Logarithmic component
  const min = Math.log10(minBin);
  const max = Math.log10(bufferLength);
  const logIndex = Math.pow(10, min + (max - min) * (i / numBars));
  
  // Blend between linear and log
  const result = Math.floor(linearIndex * (1 - logStrength) + logIndex * logStrength);
  
  // Ensure we don't exceed buffer bounds
  return Math.min(result, bufferLength - 1);
}

// Resize canvas for crisp rendering
function resizeCanvasToDisplaySize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
  }
}

// Visualizer loop
function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  resizeCanvasToDisplaySize(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  canvasContext.scale(dpr, dpr);

  analyser.getByteFrequencyData(dataArray);
  canvasContext.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  const barWidth = Math.floor(canvas.clientWidth / (barCount - skippedBars)) - barSpacing; // integer for sharpness

  for (let i = skippedBars; i < barCount; i++) {
    const dataIndex = getLogIndex(i, barCount, bufferLength);
    const rawValue = dataArray[dataIndex] || 0; // 1 in center, 0 at edges
    const barHeight = sizeScale * Math.floor(rawValue) - threshold; // integer for sharpness

    canvasContext.fillStyle = `hsl(175, 80%, 50%)`;
    canvasContext.fillRect(
      Math.floor((i - skippedBars) * (barWidth + barSpacing)),
      canvas.clientHeight - barHeight,
      Math.max(barWidth - 1, 1),
      barHeight
    );
  }
}

// Playlist playback
let currentTrack = 0;
function loadTrack(index) {
  currentTrack = index;
  audioElement.src = playlist[index];
  audioElement.load();
  audioElement.play();
  drawVisualizer();
  audioElement.onended = () => {
    loadTrack((index + 1) % playlist.length);
  };
}

function startOnFirstClick() {
  if (audioContext.state === 'suspended') audioContext.resume();
  loadTrack(0);
  document.removeEventListener('click', startOnFirstClick);
  document.removeEventListener('touchstart', startOnFirstClick);
}
document.addEventListener('click', startOnFirstClick);
document.addEventListener('touchstart', startOnFirstClick);

window.addEventListener('resize', drawVisualizer); // for crisp resizing
