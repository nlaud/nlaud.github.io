//Getting Elements
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioElement1 = document.getElementById('audioPlayer1');
audioElement1.volume = 0.5;
const audioElement2 = document.getElementById('audioPlayer2');
audioElement2.volume = 0.5;
const canvas = document.getElementById('audioVisualizer');
const canvasContext = canvas.getContext('2d');
canvasContext.imageSmoothingEnabled = false;
canvas.style.imageRendering = 'pixelated';

var vmin = Math.min(window.innerWidth, window.innerHeight);

// Playlists logic
//Unused :L
let playlist2 = [
  'audio/dayHauOliCity.mp3', 'audio/dayHeaHeaCity.mp3', 'audio/dayIkiTown.mp3', 'audio/daySeafolkVillage.mp3', 'audio/ancientPoniPath.mp3', 'audio/hallOfFame.mp3', 'audio/livelyLillie.mp3', 'audio/mantineSurf.mp3', 'audio/mysteryGift.mp3', 'audio/route1.mp3', 'audio/solgaleoLunala.mp3'
];
let playlist = [
  'audio/nightHaoOliCity.mp3', 'audio/nightHeaHeaCity.mp3', 'audio/nightIkiTown.mp3', 'audio/nightMalieCity.mp3', 'audio/nightSeafolkVillage.mp3', 'audio/welcomeBack.mp3', 'audio/myHome.mp3']; // 'audio/motherAndDaughter.mp3', 'audio/lilliesResolve.mp3'
playlist.sort(() => Math.random() - 0.5);

const now = new Date();
const currentHour = now.getHours();
// VideoAnalysis Config
var resolution = navigator.userAgentData?.mobile ? 8 : 9;
var barCount = 2 ** resolution + 1; //Just don't question it ok the +1 is needed
var barSpacing = 0.075;
var fftSize = 2 ** (resolution + 3);//4096

const threshold = 43;
var sizeScale = window.innerWidth > window.innerHeight ? 2 : 1.5;

const skippedBars = Math.floor(barCount / 16);//From Low
const ignoredBars = Math.floor(barCount / 4);//From High

const analyser = audioContext.createAnalyser();
analyser.fftSize = fftSize;
analyser.smoothingTimeConstant = 0.9;

const source = audioContext.createMediaElementSource(audioElement1);
source.connect(analyser);
const source2 = audioContext.createMediaElementSource(audioElement2);
source2.connect(analyser);

const gainNode = audioContext.createGain();
analyser.connect(gainNode);
gainNode.connect(audioContext.destination);
gainNode.gain.value = 1;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function getLogIndex(i, numBars, bufferLength, minBin = 4, logStrength = 0.85) {
  const linearIndex = minBin + (bufferLength - minBin) * (i / numBars);
  const min = Math.log10(minBin);
  const max = Math.log10(bufferLength);
  const logIndex = Math.pow(10, min + (max - min) * (i / numBars));
  const result = Math.floor(linearIndex * (1 - logStrength) + logIndex * logStrength);
  return Math.min(result, bufferLength - 1);
}

// Resize canvas for crisp rendering
function resizeCanvasToDisplaySize(canvas) {
  vmin = Math.min(window.innerWidth, window.innerHeight)
  const dpr = window.devicePixelRatio || 1;
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
  }
  sizeScale = window.innerWidth > window.innerHeight ? 2.5 : 1.5;
}

function blendHSL(hsl1, hsl2, weight1, weight2) {
  // Parse HSL strings to extract h, s, l values
  const parseHSL = (hsl) => {
    const values = hsl.match(/\d+(\.\d+)?/g).map(Number);
    return { h: values[0], s: values[1], l: values[2] };
  };

  const color1 = parseHSL(hsl1);
  const color2 = parseHSL(hsl2);
  // Normalize weights
  const totalWeight = weight1 + weight2;
  const w1 = weight1 / totalWeight;
  const w2 = weight2 / totalWeight;

  // Blend saturation and lightness (simple weighted average)
  const s = color1.s * w1 + color2.s * w2;
  const l = color1.l * w1 + color2.l * w2;

  // Blend hue properly (circular averaging)
  const h1Rad = (color1.h * Math.PI) / 180;
  const h2Rad = (color2.h * Math.PI) / 180;
  
  const x = Math.cos(h1Rad) * w1 + Math.cos(h2Rad) * w2;
  const y = Math.sin(h1Rad) * w1 + Math.sin(h2Rad) * w2;
  
  let h = (Math.atan2(y, x) * 180) / Math.PI;
  if (h < 0) h += 360;

  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

// Visualizer loop
function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  resizeCanvasToDisplaySize(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  canvasContext.scale(dpr, dpr);

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight * 0.45;

  const innerRadius = vmin * 0.25;
  const stretch = 1.2;

  const visualizerColor1 = getComputedStyle(document.documentElement).getPropertyValue('--visualizer-color-1').trim();
  const visualizerColor2 = getComputedStyle(document.documentElement).getPropertyValue('--visualizer-color-2').trim();

  analyser.getByteFrequencyData(dataArray);
  canvasContext.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  const barWidth = Math.floor(vmin / (barCount - ignoredBars - skippedBars)) - barSpacing; // integer for speed
  for (let i = skippedBars; i < barCount - ignoredBars; i++) {
    const dataIndex = getLogIndex(i, barCount + ignoredBars + skippedBars, bufferLength);
    const rawValue = dataArray[dataIndex] || 0; // 1 in center, 0 at edges
    const barHeight = (sizeScale * (Math.floor(rawValue) - threshold)); // integer for speed
    if (barHeight < 1) continue; // skip invisible bars
    var angle = i % 4 == 0  ? Math.PI +  -1 * (i - skippedBars + 0.5) / (barCount - ignoredBars - skippedBars) * Math.PI / 2 //Bot Left
    : i % 4 == 2 ? -1 * (i - skippedBars + 0.5) / (barCount - ignoredBars - skippedBars) * Math.PI / 2 // Top Right
    : i % 4 == 3 ? Math.PI + (i - skippedBars + 0.5) / (barCount - ignoredBars - skippedBars) * Math.PI / 2 // Bot Right
    : (i - skippedBars + 0.5) / (barCount - ignoredBars - skippedBars) * Math.PI / 2 // Top Left
    
    if(canvas.clientHeight > canvas.clientWidth){
      angle = angle + Math.PI / 2
    }
    
    const barX = centerX + (innerRadius - 5) * Math.cos(angle) * stretch;
    const barY = centerY + (innerRadius - 5) * Math.sin(angle);

    
    canvasContext.fillStyle = blendHSL(visualizerColor1, visualizerColor2, 1, (i - skippedBars + 0.5) / (barCount - ignoredBars - skippedBars));
    canvasContext.save();
    canvasContext.translate(barX, barY);
    canvasContext.rotate(angle - Math.PI / 2);
    canvasContext.beginPath();
    canvasContext.roundRect(
      -barWidth / 2,  // Center the bar
      0,              // Start at inner radius
      barWidth * 1.5,
      Math.max(barHeight, 1), // Extend outward
      100
    );
    canvasContext.fill();
    canvasContext.restore();
  }
}

// Playlist playback
let currentTrack = 0;
var activeAudioElement = 2;
function loadTrack(index) {
  console.log("Loading track:", playlist[index]);
  currentTrack = index;
  if (activeAudioElement === 2) {
    audioElement2.src = playlist[(index + 1) % playlist.length];
    audioElement2.load();
    audioElement1.play();
    activeAudioElement = 1;
  } else {
    audioElement1.src = playlist[(index + 1) % playlist.length];
    audioElement1.load();
    audioElement2.play();
    activeAudioElement = 2;
  }
  
  drawVisualizer();
  audioElement1.onended = () => {
    loadTrack((index + 1) % playlist.length);
  };
  audioElement2.onended = () => {
    loadTrack((index + 1) % playlist.length);
  };
}
document.documentElement.classList.add("stop-scrolling");
document.body.classList.add('stop-scrolling');
function startOnFirstClick() {
    if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      audioElement1.src = playlist[0];
      audioElement1.load();
      audioElement1.play();
      activeAudioElement = 2;
      loadTrack(0);
    });
  } else {
    audioElement1.src = playlist[0];
    audioElement1.load();
    audioElement1.play();
    activeAudioElement = 2;
    loadTrack(0);
  }

  document.getElementById("loadingScreen").classList.add('fade-out');
  document.documentElement.classList.remove("stop-scrolling");
  document.body.classList.remove('stop-scrolling');

  document.removeEventListener('click', startOnFirstClick);
  document.removeEventListener('touchend', startOnFirstClick);
}
document.addEventListener('click', startOnFirstClick, {passive: false});
document.addEventListener('touchend', startOnFirstClick, {passive: false});


window.addEventListener('resize', drawVisualizer); // for fast resizing


//Mute Button
const muteBtn = document.getElementById('muteBtn');

muteBtn.addEventListener('click', function() {
  if(gainNode.gain.value == 1){
    gainNode.gain.value = 0;
    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    muteBtn.style.background = '#e74c3c';
    muteBtn.setAttribute('aria-label', 'Unmute audio');
  }else{
    gainNode.gain.value = 1;
    muteBtn.innerHTML = '<i class="fas fa-volume-high"></i>';
    muteBtn.style.background = '#27ae60';
    muteBtn.setAttribute('aria-label', 'Mute audio');
  }
});
