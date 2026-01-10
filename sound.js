export const ctx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = ctx.createGain();
masterGain.gain.value = 1;
masterGain.connect(ctx.destination);

//Random Int Helper Function
function getRandomInt(min, max) {
  min = Math.ceil(min);   // Ensures min is an integer
  max = Math.floor(max); // Ensures max is an integer
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
}


export class BufferedSound {
  constructor(url) {
    this.url = url;
    this.buffer = null;
    this.loading = null;
    this.assetIndex = null; // Track for loading manager
  }

  async load() {
    if (this.buffer) return this.buffer;
    if (!this.loading) {
      this.loading = fetch(this.url)
        .then(r => r.arrayBuffer())
        .then(data => ctx.decodeAudioData(data))
        .then(buf => {
          this.buffer = buf;
          return buf;
        });
    }
    return this.loading;
  }

  // Register with loading manager for preload tracking
  registerPreload(assetIndex) {
    this.assetIndex = assetIndex;
  }

  // Preload and track progress
  async preload() {
    try {
      await this.load();
      if (this.assetIndex !== null && window.loadingManager) {
        window.loadingManager.assetLoaded(this.assetIndex);
      }
    } catch (err) {
      console.error(`Failed to preload sound: ${this.url}`, err);
      if (this.assetIndex !== null && window.loadingManager) {
        window.loadingManager.assetLoaded(this.assetIndex);
      }
    }
  }

  async play(volume = 0.5) {
    await this.load();
    if (!this.buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = this.buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;     

    source.connect(gain);
    gain.connect(masterGain);            

    source.start(ctx.currentTime);

    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
  }
}

const clickSfx = new BufferedSound('/resources/sounds/click.mp3');

export async function playClickSfx(){
  if (ctx.state === 'suspended') await ctx.resume();
  clickSfx.play(0.5);
}
const woodSfx1 = new BufferedSound('/resources/sounds/Wood1.ogg');
const woodSfx2 = new BufferedSound('/resources/sounds/Wood2.ogg');
const woodSfx3 = new BufferedSound('/resources/sounds/Wood3.ogg');
const woodSfx4 = new BufferedSound('/resources/sounds/Wood4.ogg');
const woodSfx5 = new BufferedSound('/resources/sounds/Wood5.ogg');
const woodSfx6 = new BufferedSound('/resources/sounds/Wood6.ogg');


var woodCount = 1;
async function playWoodStep(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  var oldWoodCount = woodCount;
  while(woodCount == oldWoodCount){
    woodCount = getRandomInt(1, 6);
  }
  switch(woodCount){
    case 1:
      woodSfx1.play(volume);
      break;
    case 2:
      woodSfx2.play(volume);
      break;
    case 3:
      woodSfx3.play(volume);
      break;
    case 4:
      woodSfx4.play(volume);
      break;
    case 5:
      woodSfx5.play(volume);
      break;
    case 6:
      woodSfx6.play(volume);
      break; 
  }
  
}

export async function startWoodSfxLoop(duration){
  if (ctx.state === 'suspended') await ctx.resume();
  var loopInterval = setInterval(playWoodStep, 450, 0.2);
  setTimeout(clearInterval, duration * 1000, loopInterval);
}

const grassSfx1 = new BufferedSound('/resources/sounds/Grass1.ogg');
const grassSfx2 = new BufferedSound('/resources/sounds/Grass2.ogg');
const grassSfx3 = new BufferedSound('/resources/sounds/Grass3.ogg');
const grassSfx4 = new BufferedSound('/resources/sounds/Grass4.ogg');
const grassSfx5 = new BufferedSound('/resources/sounds/Grass5.ogg');
const grassSfx6 = new BufferedSound('/resources/sounds/Grass6.ogg');


var grassCount = 1;
async function playGrassStep(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  var oldGrassCount = grassCount;
  while(grassCount == oldGrassCount){
    grassCount = getRandomInt(1, 6);
  }
  switch(grassCount){
    case 1:
      grassSfx1.play(volume);
      break;
    case 2:
      grassSfx2.play(volume);
      break;
    case 3:
      grassSfx3.play(volume);
      break;
    case 4:
      grassSfx4.play(volume);
      break;
    case 5:
      grassSfx5.play(volume);
      break;
    case 6:
      grassSfx6.play(volume);
      break; 
  }
  
}

export async function startGrassSfxLoop(duration){
  if (ctx.state === 'suspended') await ctx.resume();
  var loopInterval = setInterval(playGrassStep, 450, 0.2);
  setTimeout(clearInterval, duration * 1000, loopInterval);
}

const doorOpenSfx1 = new BufferedSound('/resources/sounds/DoorOpen1.ogg');
const doorOpenSfx2 = new BufferedSound('/resources/sounds/DoorOpen2.ogg');
const doorCloseSfx1 = new BufferedSound('/resources/sounds/DoorClose1.ogg');
const doorCloseSfx2 = new BufferedSound('/resources/sounds/DoorClose2.mp3');

export async function playDoorOpen(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  let random = getRandomInt(1, 2);
  if (random == 1){
    doorOpenSfx1.play(volume);
  }else{
    doorOpenSfx2.play(volume);
  }
}

export async function playDoorClose(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  let random = getRandomInt(1, 2);
  if (random == 1){
    doorCloseSfx1.play(volume);
  }else{
    doorCloseSfx2.play(volume);
  }
}

const teleportSfx1 = new BufferedSound('/resources/sounds/Teleport1.ogg');
const teleportSfx2 = new BufferedSound('/resources/sounds/Teleport2.ogg');
export async function playTeleportSound(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  let random = getRandomInt(1, 2);
  if (random == 1){
    teleportSfx1.play(volume);
  }else{
    teleportSfx2.play(volume);
  }
}

const pistonExtendSfx = new BufferedSound('/resources/sounds/PistonExtend.ogg');
const pistonContractSfx = new BufferedSound('/resources/sounds/PistonContract.ogg');

export async function playPistonSound(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  pistonExtendSfx.play(volume);
  setTimeout(() => {
    pistonContractSfx.play(volume);
  }, 1000);
}

const buttonPressSfx = new BufferedSound('/resources/sounds/ButtonPress.mp3');
const buttonUnpressSfx = new BufferedSound('/resources/sounds/ButtonUnpress.mp3');
export async function playButtonSound(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  buttonPressSfx.play(volume);
  setTimeout(() => {
    buttonUnpressSfx.play(volume);
  }, 1000);
}

const waterLandSfx = new BufferedSound('/resources/sounds/Water.mp3');
export async function playWaterSound(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  waterLandSfx.play(volume);
}

const pageTurnSfx1 = new BufferedSound('/resources/sounds/PageTurn1.ogg');
const pageTurnSfx2 = new BufferedSound('/resources/sounds/PageTurn2.ogg');
export async function playPageTurnSound(volume) {
  if (ctx.state === 'suspended') await ctx.resume();
  let random = getRandomInt(1, 2);
  if (random == 1){
    pageTurnSfx1.play(volume);
  }else{
    pageTurnSfx2.play(volume);
  }
}

// Preload all sounds during initialization
export function preloadAllSounds(loadingManager) {
  const allSounds = [
    clickSfx,
    woodSfx1, woodSfx2, woodSfx3, woodSfx4, woodSfx5, woodSfx6,
    grassSfx1, grassSfx2, grassSfx3, grassSfx4, grassSfx5, grassSfx6,
    doorOpenSfx1, doorOpenSfx2, doorCloseSfx1, doorCloseSfx2,
    teleportSfx1, teleportSfx2,
    pistonExtendSfx, pistonContractSfx,
    buttonPressSfx, buttonUnpressSfx,
    waterLandSfx,
    pageTurnSfx1, pageTurnSfx2
  ];

  allSounds.forEach(sound => {
    const assetIndex = loadingManager.addAsset();
    sound.registerPreload(assetIndex);
    sound.preload();
  });
}