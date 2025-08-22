//YT API saveing and cookie storage
function setCookie(cname,cvalue,exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

let YTAPIKEY = getCookie("apikey");
if(YTAPIKEY == ""){
  YTAPIKEY = prompt("Enter your YouTube API KEY (Available free by following the instructions at https://developers.google.com/youtube/v3/getting-started):", "");
  if (YTAPIKEY != "" && YTAPIKEY != null) {
    setCookie("apikey", YTAPIKEY, 365);
  }
}

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;

var playerWidth;
var playerHeight;
if(window.innerWidth <= 600){
  playerWidth = window.innerWidth * 0.75;
  playerHeight = playerWidth * 9 / 16;
}else{
  playerWidth = window.innerWidth * 0.24;
  playerHeight = playerWidth * 9 / 16;
}

addEventListener("resize", (event) => {
  if(window.innerWidth <= 600){
    playerWidth = window.innerWidth * 0.75;
    playerHeight = playerWidth * 9 / 16;
  }else{
    playerWidth = window.innerWidth * 0.24;
    playerHeight = playerWidth * 9 / 16;
  }
  player.setSize(playerWidth, playerHeight)
});

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: playerHeight,
    width: playerWidth,
    playerVars: {
      'controls': 0,
      'autoplay': 1,
    },
    events:{
      onStateChange: videoStateChange,
    }
  });
  
}
var queueLength = 15;
//Main Classes
class playlist{
  constructor() {
    this.name = "New Playlist";
    this.shuffle = false;
    this.videos = [];
    this.videoQueue = [];
    this.currentIndex = -1;
    this.isPlaying = false;
  }
  
  //Clips
  async addFromUrl(url){
    var apiUrl = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=" + idFromUrl(url) + "&key=" + YTAPIKEY;
    var chaptersRegex = new RegExp("((?:(?:[01]?\\d|2[0-3]):)?(?:[0-5]?\\d):(?:[0-5]?\\d))([^\\\n]+)", "gm");
    this.apiUrl = apiUrl;
    await fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if(typeof data.items[0] !== 'undefined'){
          var description = data.items[0].snippet.description;
          var title = data.items[0].snippet.title;
          var duration = ytDurToSeconds(data.items[0].contentDetails.duration);
          var chapters =  Array.from(description.matchAll(chaptersRegex));
          if(chapters.length > 0){
            for(var i = 0; i < chapters.length - 1; i++){
              this.videos.push(new videoClip(chapters[i][2], idFromUrl(url), hmsToSeconds(chapters[i][1]), hmsToSeconds(chapters[i + 1][1]) - hmsToSeconds(chapters[i][1])));
            }
            this.videos.push(new videoClip(chapters[i][2], idFromUrl(url), hmsToSeconds(chapters[chapters.length - 1][1]), duration - hmsToSeconds(chapters[chapters.length - 1][1])))
          }else{
            this.videos.push(new videoClip(title, idFromUrl(url), 0, parseInt(duration)))
          }
        }else{
          alert("Bad Link")
        }
        currentPlaylist.update()
      });
  }
  
  deleteClip(index){
    if(confirm("Are you sure you want to delete " + currentPlaylist.videos[index].name + "?")){
      this.videos.splice(index, 1);

      for(var i = 0; i < this.videoQueue.length; i++){
        if(this.videoQueue[i] > index){
          this.videoQueue[i] -= 1
        }else if(this.videoQueue[i] = index){
          this.videoQueue.splice(i, 1)
        }
      }

      if(this.currentIndex > index){
        this.currentIndex --;
      }

      this.update();
    }
  }
  
  swapClips(index1, index2){
    var temp = this.videos[index1]
    this.videos[index1] = this.videos[index2]
    this.videos[index2] = temp
    
    for(var i = 0; i < this.videoQueue.length; i++){
      if(this.videoQueue[i] == index1){
        this.videoQueue[i] = index2
      }else if(this.videoQueue[i] == index2){
        this.videoQueue[i] = index1;
      }
    }
    
    if(this.currentIndex == index1){
      this.currentIndex  = index2;
    }else if(this.currentIndex == index2){
      this.currentIndex = index1;
    }
    
    //currentPlaylist.updateTracks();
  }
  
  //Playing Videos
  playNextVideo(){
    if(this.videoQueue.length > 0){
      this.currentIndex = this.videoQueue.splice(0, 1)[0]
      this.videos[this.currentIndex].playClip();

      this.update();
    }
  }
  
  playPauseVideo(){
    if(this.isPlaying){
      player.pauseVideo()
    }else{
      player.playVideo()
    }
  }
  
  //Queue

  updateQueue(){
    if(this.videos.length > 0){
      if(this.shuffle){
        while(this.videoQueue.length < queueLength){
          var testIndex = Math.floor(Math.random() * this.videos.length);
          var testCount = 0
          while(this.videoQueue.includes(testIndex) && testCount < queueLength){
            testIndex = Math.floor(Math.random() * this.videos.length);
            testCount++
          }
          this.videoQueue.push(testIndex);
        }
      }else{
        for(var i = 0; i < queueLength; i++){
          this.videoQueue[i] = (this.currentIndex + i + 1) % this.videos.length;
        }
      }
      
      document.getElementById("queueHolder").innerHTML = "";

      for(var i = 0; i < this.videoQueue.length; i++){
        document.getElementById("queueHolder").innerHTML += `<h4 class='queueVideo' onclick="skipInQueue(` + i + `)">` + (i + 1) + " " +  this.videos[this.videoQueue[i]].name + `</h4>`;
      }
    }
  }
  
  resetQueue(){
    this.videoQueue = [];
    this.updateQueue();
  }
  
  //Updating GUI
  updateTracks(){
    document.getElementById("tracksTable").innerHTML = `<tr style="position:sticky" class="tableHeader">
        <th style="width: 75%">Title</th>
          <th style="width: 12.5%">
            <i class="fa fa-clock-o" aria-hidden="true"></i>
          </th>
          <th style="width: 12.5%">
            <i class="fa fa-cog" aria-hidden="true"></i>
          </th>
        </tr>`;
    for(var i = 0; i < this.videos.length; i++){
      if(this.currentIndex == i){
        document.getElementById("tracksTable").innerHTML += `<tr style="color:` + accentColor + `" class="trackRow" draggable="true" ondragend="dragEnd(event)" ondragover="dragOver(event)" ondragstart="dragStart(event)">
        <td>` + this.videos[i].name + `</td>
        <td>` + secondsToHMSString(this.videos[i].duration) + `</td>
        <td style="display: flex;justify-content: space-between;">
            <div>
              <i class="fa fa-trash" aria-hidden="true"></i>
            </div> 
          </td>
        </tr>`;
      }else{
        document.getElementById("tracksTable").innerHTML += `<tr class="trackRow" draggable="true" ondragend="dragEnd(event)" ondragover="dragOver(event)" ondragstart="dragStart(event)">
        <td onclick="skipToSong(` + i + `)">` + this.videos[i].name + `</td>
        <td onclick="skipToSong(` + i + `)">` + secondsToHMSString(this.videos[i].duration) + `</td>
        <td style="display: flex;justify-content: space-between;">
        <div>
          <i class="fa fa-trash" aria-hidden="true" onclick="currentPlaylist.deleteClip(` + i + `)"></i>
        </div>
        </td>
        </tr>`;
      }
    }
    saveAllPlaylists()
  }
  
  updateTitleGUI(){
    document.getElementById("playlistName").value = this.name;
    
    if(currentPlaylist.shuffle){
      document.getElementById("shufflePlaylist").children[0].style.color = "var(--accentColor)";
    }else{
      document.getElementById("shufflePlaylist").children[0].style.color = "var(--textColor)";
    }
    
    var totalDuration = 0;
    for(var i = 0; i < this.videos.length; i++){
      totalDuration += this.videos[i].duration;
    }
    document.getElementById("playlistDuration").innerHTML = secondsToHMSString(totalDuration)
  }
  
  update(){
    this.updateTracks()
    this.updateQueue()
    this.updateTitleGUI()
  }
}

//Each Clip
class videoClip{
  constructor(name, id, startTime, duration) {
    this.name = name;
    this.id = id;
    this.startTime = startTime;
    this.duration = duration;
  }
  
  playClip(){
    player.loadVideoById({videoId:this.id, startSeconds:this.startTime, endSeconds: this.startTime + this.duration});
    document.getElementById("currentPlayingDuration").innerHTML = secondsToHMSString(this.duration);
    document.getElementById("currentPlayingTitle").innerHTML = this.name;
    currentClip = this;
  }
}


//Helper Functions
function idFromUrl(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

function hmsToSeconds(str) {
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}

function secondsToHMSString(seconds){
  if (seconds >= 3600){
    return new Date(seconds * 1000).toISOString().substring(11, 19)
  }else{
    return new Date(seconds * 1000).toISOString().substring(14, 19)
  }
  
}

function ytDurToSeconds(str){
  var durationRegex = /PT(([0-23])H)?(([0-5]?\d?)M)?(([0-5]?\d?)S)?/;
  var durationSplit = str.match(durationRegex)
  if(typeof durationSplit[1] == "undefined"){
    durationSplit[1] = 0
  }else if(typeof durationSplit[3] == "undefined"){
    durationSplit[3] = 0
  }else if(typeof durationSplit[5] == "undefined"){
    durationSplit[5] = 0
  }
  return parseInt(durationSplit[1]) * 60 * 60 + parseInt(durationSplit[3]) * 60 + parseInt(durationSplit[5])
  
}

//Event Listeners

document.getElementById("playlistName").oninput = function(){
  currentPlaylist.name = this.value;
  
  updatePlaylists()
}

document.getElementById("shufflePlaylist").onclick = function(){
  currentPlaylist.shuffle = !currentPlaylist.shuffle;
  currentPlaylist.update();
  currentPlaylist.resetQueue();
};

document.getElementById("exportPlaylist").onclick = function(){
  navigator.clipboard.writeText(JSON.stringify(currentPlaylist));
  alert("Playlist data saved to clipboard");
}

document.getElementById("importPlaylist").onclick = function(){
  navigator.clipboard.readText()
  .then(text => {
    var loadedPlaylist = loadPlaylist(JSON.parse(text));
    allPlaylists.push(loadedPlaylist);
    updatePlaylists();
    alert("Playlist imported from clipboard")
  }).catch(err => {
    alert('Failed to read clipboard contents: ', err);
  });
}

/*
document.getElementById("skip").onclick = function(){
  skipInQueue(0);
}
*/
document.getElementById("play").onclick = function(){
  if(player.getDuration() == 0){//No Video Playing
    currentPlaylist.playNextVideo();
  }else{
    currentPlaylist.playPauseVideo();
  }
}

document.getElementById("currentPlayingProgress").onclick = function(){
  if(player.getDuration() == 0){//No Video Playing
    currentPlaylist.playNextVideo();
  }else{
    currentPlaylist.playPauseVideo();
  }
}

document.getElementById("addVideo").onclick = function(){
  currentPlaylist.addFromUrl(prompt("Paste Video URL:"))
}

document.getElementById("deletePlaylist").onclick = function(){
  if(confirm("Are you sure you want to delete " + currentPlaylist.name + "?")){
    var index = allPlaylists.map(function(e) { return JSON.stringify(e); }).indexOf(JSON.stringify(currentPlaylist));
    for(var i = index; i < allPlaylists.length - 1; i++){
      allPlaylists[i] = allPlaylists[i + 1]
    }

    allPlaylists.splice(allPlaylists.length - 1, 1)

    globalUpdate();
  }
}

document.getElementById("volumeSlider").oninput = function(){
  player.setVolume(Math.max(0, Math.min(this.value, 100)));
  
  document.getElementById("volumeIcon").classList.remove("fa-volume-up")
  document.getElementById("volumeIcon").classList.remove("fa-volume-down")
  document.getElementById("volumeIcon").classList.remove("fa-volume-off")
  if(this.value > 66){
    document.getElementById("volumeIcon").classList.add("fa-volume-up")
  }else if(this.value > 33){
    document.getElementById("volumeIcon").classList.add("fa-volume-down")
  }else{
    document.getElementById("volumeIcon").classList.add("fa-volume-off")
  }
  
}

document.getElementById("currentPlayingBar").oninput = function(){
  player.seekTo(this.value / 100 * currentClip.duration + currentClip.startTime, true)
  currentPlaylist.playPauseVideo();
}

document.getElementById("apiResetButton").onclick = function(){
  YTAPIKEY = prompt("Enter your YouTube API KEY (Available free by following the instructions at https://developers.google.com/youtube/v3/getting-started):", "");
  if (YTAPIKEY != "" && YTAPIKEY != null) {
    setCookie("apikey", YTAPIKEY, 365);
  }
}

//Autoplaying next song
var lastState = -1;
function videoStateChange(event){
  if(event.data == 0){//Ended
    if(lastState == 1){//Not sure why but there is a bug and this triggers twice otherwise
      currentPlaylist.playNextVideo();
    }
  }else if(event.data == 1){//Play
    currentPlaylist.isPlaying = true;
  }else if(event.data == 2){//Pause
    currentPlaylist.isPlaying = false;
  }
  
  if(currentPlaylist.isPlaying){
    document.getElementById("play").children[0].style.color = "var(--accentColor)";
  }else{
    document.getElementById("play").children[0].style.color = "var(--textColor)";
  }
  
  lastState = event.data
}

//Song Navigation
function skipToSong(songIndex){
  currentPlaylist.videoQueue[0] = songIndex
  currentPlaylist.playNextVideo();
}

function skipInQueue(queueIndex){
  currentPlaylist.videoQueue.splice(0, queueIndex)
  currentPlaylist.playNextVideo();
}

function updatePlayingBar(){
  if(typeof currentClip != 'undefined' && player.getCurrentTime() >= currentClip.startTime){
    document.getElementById("currentPlayingBar").value = (player.getCurrentTime() - currentClip.startTime) / currentClip.duration * 100;
  }
  setTimeout(updatePlayingBar, 1000);
}

//Multiple Playlist Management
function updatePlaylists(){
  document.getElementById("playlistList").innerHTML = "";
  for(var i = 0; i < allPlaylists.length; i++){
    if(allPlaylists[i] == currentPlaylist){
      document.getElementById("playlistList").innerHTML += `<div class="playlistData" draggable="true" ondragend="dragEnd(event)" ondragover="dragOver(event)" ondragstart="dragStart(event)">
            <i class="fa fa-play" aria-hidden="true" style = "color: ` + accentColor  +`"></i>
            <h3 class="playlistName" style = "color: ` + accentColor  +`">` + allPlaylists[i].name + `</h3>
          </div>`;
    }else{
      document.getElementById("playlistList").innerHTML += `<div class="playlistData" onclick="setCurrentPlaylist(` + i + `)" draggable="true" ondragend="dragEnd(event)" ondragover="dragOver(event)" ondragstart="dragStart(event)">
            <i class="fa fa-play" aria-hidden="true"></i>
            <h3 class="playlistName">` + allPlaylists[i].name + `</h3>
          </div>`;
    }
  }
  
  saveAllPlaylists();
}

document.getElementById("newPlaylist").onclick = function(){
  allPlaylists.push(new playlist());
  setCurrentPlaylist(allPlaylists.length - 1)
}

function setCurrentPlaylist(index){
  currentPlaylist = allPlaylists[index];
  currentPlaylist.currentIndex = -1
  globalUpdate();
  currentPlaylist.playNextVideo();
}

function globalUpdate(){
  if(allPlaylists.length == 0){
    allPlaylists = [new playlist()]
    currentPlaylist = allPlaylists[0];
  }
  updatePlaylists();
  currentPlaylist.update();
}

//Data Saving / Loading
function calculateLocalStorageSpace(){
  localStorage.removeItem('size');
  if (localStorage && !localStorage.getItem('size')) {
      var i = 0;
      try {
          // Test up to 100 MB
          for (i = 250; i <= 100000; i += 250) {
              localStorage.setItem('test', new Array((i * 1024) + 1).join('a'));
          }
      } catch (e) {
          localStorage.removeItem('test');
          localStorage.setItem('size', i - 250);  
      }
  }
}
function saveAllPlaylists(){
  var i = 0;
  while(typeof localStorage.getItem("playlist" + i) !== 'undefined' && localStorage.getItem("playlist" + i) !== null){
    localStorage.removeItem("playlist" + i)
    i++
  }
  
  for(var i = 0; i < allPlaylists.length; i++){
    try{
      localStorage.setItem("playlist" + i, JSON.stringify(allPlaylists[i]));
    }catch (e){
      alert("Error saving playlist. Storage might be full.");
    }
    
  }
}

function loadPlaylist(jsonObj){
  var loadedPlaylist = new playlist()
  
  loadedPlaylist.name = jsonObj.name
  loadedPlaylist.shuffle = jsonObj.shuffle
  
  for(var i = 0; i < jsonObj.videos.length; i++){
    loadedPlaylist.videos.push(new videoClip(jsonObj.videos[i].name, jsonObj.videos[i].id, jsonObj.videos[i].startTime, jsonObj.videos[i].duration))
  }
  
  loadedPlaylist.currentIndex = -1
  
  return loadedPlaylist
}

function loadPlaylists(){
  allPlaylists = [];
  var i = 0
  while(typeof localStorage.getItem("playlist" + i) !== 'undefined' && localStorage.getItem("playlist" + i) !== null){
    var loadedPlaylist = loadPlaylist(JSON.parse(localStorage.getItem("playlist" + i)));
    
    allPlaylists.push(loadedPlaylist);
    
    i++;
  }
  
  currentPlaylist = allPlaylists[0];
  globalUpdate();
}

//Draggable Lists(Original From: https://codepen.io/crouchingtigerhiddenadam/pen/qKXgap)
var dragSelected = null
var dragStartIndex = 0
var dragEndIndex = 0

//Helper Function
var childindex = function (node) {
    var index = 0;
    while (node.previousSibling) {
        if (arguments.length == childindex.length || node.previousSibling.nodeName.toLowerCase() == arguments[1]) 
        {
            index++;
        }
        node = node.previousSibling;
    }
    return index;
}

function dragOver(e) {
  //console.log(dragSelected.parentNode)
  //console.log("dragging over: " + e.target.parentElement.parentNode)
  if(dragSelected.parentNode.contains(e.target)){
    var dragChild;
    for(var child of dragSelected.parentNode.children){
      if(child.contains(e.target)){
        var dragChild = child;
      }
    }  
    
    if (isBefore(dragSelected, dragChild)) {
      dragChild.parentNode.insertBefore(dragSelected, dragChild)
      dragEndIndex = childindex(dragSelected)
    } else {
      dragChild.parentNode.insertBefore(dragSelected, dragChild.nextSibling)
      dragEndIndex = childindex(dragSelected)
    }
  }
}

function dragEnd(e) {
  dragSelected = null;
  //console.log("Drag from: " + dragStartIndex + " to " + dragEndIndex);
  if(e.target.className == "playlistData"){
    if(dragStartIndex > dragEndIndex){
      var tempPlaylist = allPlaylists[dragStartIndex]
      for(var i = dragStartIndex; i > dragEndIndex; i--){
        allPlaylists[i] = allPlaylists[i - 1];
      }
      allPlaylists[dragEndIndex] = tempPlaylist;
    }else if(dragStartIndex < dragEndIndex){
      var tempPlaylist = allPlaylists[dragStartIndex]
      for(var i = dragStartIndex; i < dragEndIndex; i++){
        allPlaylists[i] = allPlaylists[i + 1];
      }
      allPlaylists[dragEndIndex] = tempPlaylist;
    }
    updatePlaylists();
  }else if(e.target.className == "trackRow"){
    dragStartIndex -= 1
    dragEndIndex -= 1
    if(dragStartIndex > dragEndIndex){
      for(var i = dragStartIndex; i > dragEndIndex; i--){
        currentPlaylist.swapClips(i, i-1);
      }
    }else if(dragStartIndex < dragEndIndex){
      for(var i = dragStartIndex; i < dragEndIndex; i++){
        currentPlaylist.swapClips(i, i+1);
      }
    }
    currentPlaylist.update();
  }
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', null)
  dragSelected = e.target
  dragStartIndex = childindex(e.target)
}

function isBefore(el1, el2) {
  let cur
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true
    }
  }
  return false;
}

//Settings Menus
var modalBackground = document.getElementById("modalBackground");
var settingsButton = document.getElementById("settingsButton");
var settingsSaveButton = document.getElementById("saveSettingsButton");

var closeBtn = document.getElementById("closeSettingsButton");

//Helper Functions
function isLight(color) {// From https://awik.io/determine-color-bright-dark-using-javascript/

    // Variables for red, green, blue values
    var r, g, b, hsp;
    
    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {

        // If RGB --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        
        r = color[1];
        g = color[2];
        b = color[3];
    } 
    else {
        
        // If hex --> Convert it to RGB: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace( 
        color.length < 5 && /./g, '$&$&'));

        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }
    
    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    if (hsp>127.5) {

        return true;
    } 
    else {

        return false;
    }
} 
function LightenDarkenColor(color, amount) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R + amount);
    G = parseInt(G + amount);
    B = parseInt(B + amount);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R)
    G = Math.round(G)
    B = Math.round(B)

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

function colorNameToHex(color) //From https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
{
    var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff","darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f","darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1","darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f","honeydew":"#f0fff0","hotpink":"#ff69b4","indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2","lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080","rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee", "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd32"};

    if (typeof colors[color.toLowerCase()] != 'undefined')
        return colors[color.toLowerCase()];

    return false;
}
function invertColor(hex) //From https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
{
    if(colorNameToHex(hex)){
      return invertColor(colorNameToHex(hex));
    }
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

var bgColor = "";
var textColor = "";
var accentColor = "";

var bgColorSetting = document.getElementById("bgColorSetting");
var textColorSetting = document.getElementById("textColorSetting");
var accentColorSetting = document.getElementById("accentColorSetting");

function loadSettings(){
  if(typeof localStorage.getItem("settings") !== 'undefined' && localStorage.getItem("settings") !== null){
    var settings = localStorage.getItem("settings").split(",");
    bgColorSetting.value = settings[0];
    textColorSetting.value = settings[1];
    accentColorSetting.value = settings[2];
  }else{
    bgColorSetting.value = "#F5F4F6";
    textColorSetting.value = "#131614";
    accentColorSetting.value = "#20DF9F";
  }
  
  bgColor = bgColorSetting.value;
  textColor = textColorSetting.value;
  accentColor = accentColorSetting.value;
  
  updateSettingsMenu();
  applySettings();
}

function updateSettingsMenu(){
  bgColor = bgColorSetting.value;
  textColor = textColorSetting.value;
  accentColor = accentColorSetting.value;
  
  if(colorNameToHex(bgColor)){
    bgColor = colorNameToHex(bgColor);
    bgColorSetting.value = bgColor;
  }
  if(colorNameToHex(textColor)){
    textColor = colorNameToHex(textColor);
    textColorSetting.value = textColor;
  }
  if(colorNameToHex(accentColor)){
    accentColor = colorNameToHex(accentColor);
    accentColorSetting.value = accentColor;
  }
  
  bgColorSetting.style.color = bgColor;
  if(isLight(bgColor)){
    bgColorSetting.style.backgroundColor = "#000000";
  }else{
    bgColorSetting.style.backgroundColor = "#ffffff";
  }
  textColorSetting.style.color = textColor;
  accentColorSetting.style.color = accentColor;
}

function applySettings(){
  document.documentElement.style.setProperty("--bgColor", bgColor);
  document.documentElement.style.setProperty("--textColor", textColor);
  document.documentElement.style.setProperty("--accentColor", accentColor);
  
  if(isLight(bgColor)){
    document.documentElement.style.setProperty("--hoverBgColor", LightenDarkenColor(bgColor, -20))
    document.documentElement.style.setProperty("--activeBgColor", LightenDarkenColor(bgColor, -40))
  }else{
    document.documentElement.style.setProperty("--hoverBgColor", LightenDarkenColor(bgColor, 20))
    document.documentElement.style.setProperty("--activeBgColor", LightenDarkenColor(bgColor, 40))
  }
  
  bgColorSetting.style.color = bgColor;
  if(isLight(bgColor)){
    bgColorSetting.style.backgroundColor = "#000000";
  }else{
    bgColorSetting.style.backgroundColor = "#ffffff";
  }
  
  
  globalUpdate();
  modalBackground.style.display = "none";
  
  try{
    localStorage.setItem("settings", [bgColor, textColor, accentColor]);
  }catch (e){
    alert("Error saving settings. Browser storage might be full.");
  }
}

//Settings Event Listners
settingsButton.onclick = function() {
  modalBackground.style.display = "block";
}

closeBtn.onclick = function() {
  modalBackground.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modalBackground) {
    modalBackground.style.display = "none";
  }
}

settingsSaveButton.onclick = function(){
  applySettings();
}

document.getElementById("resetThemeButton").onclick = function(){
  bgColorSetting.value = "#F5F4F6";
  textColorSetting.value = "#131614";
  accentColorSetting.value = "#20DF9F";
  updateSettingsMenu();
}
document.getElementById("bgColorSetting").oninput = function(){
  updateSettingsMenu();
}
document.getElementById("textColorSetting").oninput = function(){
  updateSettingsMenu();
}
document.getElementById("accentColorSetting").oninput = function(){
  updateSettingsMenu();
}
//Visualizer
//Initialization
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(dataArray);

function initVisualizer(){
  navigator.mediaDevices.getDisplayMedia({
     video: true,
     audio: true
   })
   .then(stream => {
      if (stream.getAudioTracks().length > 0) {
        var source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        document.body.classList.add('ready');
      } else {
        console.log('Failed to get stream. Audio not shared or browser not supported');
      }

   }).catch(err => console.log("Unable to open capture: ", err));
}

//Runtime
var allPlaylists = [new playlist()];
var currentPlaylist = allPlaylists[0];
var currentClip;

if(typeof localStorage.getItem("playlist0") !== 'undefined' && localStorage.getItem("playlist0") !== null){
  loadPlaylists();
}else{
  globalUpdate();
}

loadSettings();

updatePlayingBar();