//Adds a link to a speicific list
function addLink(element) {
  var linkGroup = element.parentElement.children[3].children[1];
  var currentLinks = [];
  for (var i = 0; i < linkGroup.children.length; i++) {
    currentLinks.push(linkGroup.children[i].children[0].value);
  }
  linkGroup.innerHTML += `
  <li>
    <input type="text" value="" style="width: 65%"/>
    <button class="btn" onclick="launchSite(this)">
      <i class="fa fa-upload"></i>
    </button>
    <button class="btn" onclick="removeLink(this)">
      <i class="fa fa-trash"></i>
    </button>
  </li>
  `;
  for (var i = 0; i < currentLinks.length; i++) {
    linkGroup.children[i].children[0].value = currentLinks[i];
  }
}

//Removes a link from a container
function removeLink(element) {
  element.parentElement.remove();
}

//Adds containers to the main page
function addContainer() {
  var containerGroup = document.getElementById("containersGroup");
  saveData();
  containerGroup.innerHTML = "";
  loadSave();
  containerGroup.innerHTML += `
  <div class="w3-third">
    <div class="w3-card w3-container">
      <button class="btn" onclick="launchSites(this)">
        <i class="fa fa-upload"></i>
      </button>
      <button class="add_btn" onclick="removeContainer(this)">
        <i class="fa fa-trash"></i>
      </button>
      <button class="add_btn" onclick="addLink(this)">
        <i class="fa fa-plus"></i>
      </button>
      <div class="w3-center">
        <input type="text" style="width: 50%"/>
        <ul>
          <li>
            <input type="text" style="width: 65%"/>
            <button class="btn" onclick="launchSite(this)">
              <i class="fa fa-upload"></i>
            </button>
            <button class="btn" onclick="removeLink(this)">
              <i class="fa fa-trash"></i>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
  `;
}

//Removes a container
function removeContainer(element) {
  element.parentElement.parentElement.remove();
}

//Launches a single site
function launchSite(element) {
  var link = element.parentElement.children[0].value;
  if(link.slice(0,8) != "https://"){
    link = "https://" + link;
  }
  window.open(link);
}

//Launches all the sites in one container
function launchSites(element) {
  var linkGroup = element.parentElement.children[3].children[1];
  var allLinks = [];
  for (var i = 0; i < linkGroup.children.length; i++) {
    if (linkGroup.children[i].children[0].value != "") {
      console.log(linkGroup.children[i].children[0].value);
      window.open(linkGroup.children[i].children[0].value);
    }
  }
}

//Adds containers to the main page with link array links, separated by ","
function loadContainer(links) {
  var containerGroup = document.getElementById("containersGroup");
  
  var linksArray = links.split(",")
  console.log(linksArray);
  
  var containerHTML = "";
  containerHTML += `
  <div class="w3-third">
    <div class="w3-card w3-container">
      <button class="btn" onclick="launchSites(this)">
        <i class="fa fa-upload"></i>
      </button>
      <button class="add_btn" onclick="removeContainer(this)">
        <i class="fa fa-trash"></i>
      </button>
      <button class="add_btn" onclick="addLink(this)">
        <i class="fa fa-plus"></i>
      </button>
      <div class="w3-center">
        <input type="text" style="width: 50%" value = '` + linksArray[0] + `' />
        <ul>`;
  for(var i = 1; i < linksArray.length - 1; i++){
    containerHTML +=`
      <li>
    <input type="text" value='` + linksArray[i] + `' style="width: 65%"/>
    <button class="btn" onclick="launchSite(this)">
      <i class="fa fa-upload"></i>
    </button>
    <button class="btn" onclick="removeLink(this)">
      <i class="fa fa-trash"></i>
    </button>
  </li>
    `;
  }
  containerHTML += `
        </ul>
      </div>
    </div>
  </div>
  `;
  containerGroup.innerHTML += containerHTML;
}

function saveData(){
  var containerGroup = document.getElementById("containersGroup");
  var linkContainers = containerGroup.children;
  var saveString = "";
  
  for(var linkContainer of linkContainers){
    var titleElement = linkContainer.children[0].children[3].children[0];
    var linkElements = linkContainer.children[0].children[3].children[1].children;
    saveString += titleElement.value + ",";
    for(var linkElement of linkElements){
      saveString += linkElement.children[0].value + ",";
    }
    saveString += "|"
  }
  
  setCookie("saveData", saveString);
}

function loadSave(){
  var saveArrays = getCookie("saveData").split("|");
  console.log(getCookie("saveData"), saveArrays)
   for(var i = 0; i < saveArrays.length - 1; i++){
    loadContainer(saveArrays[i])
  }
}

function setCookie(cname,cvalue) {
  console.log("Cookie Created: " + cname, cvalue)
  let expires = "expires=" + new Date(2147483647 * 1000).toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  console.log(getCookie(cname))
  console.log(document.cookie)
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