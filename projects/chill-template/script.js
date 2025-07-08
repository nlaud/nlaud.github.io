function crazy(){
  var crazyCount = document.getElementById("rats").value;
  var crazyText = ""
  for(var i = 0; i < crazyCount; i++){
    crazyText += " Crazy? I was crazy once they locked me in a room a rubber room a rubber room with rats. Rats make me crazy."
    //alert("Crazy? I was crazy once they locked me in a room a rubber room a rubber room with rats. Rats make me crazy.");
  }
  navigator.clipboard.writeText(crazyText);
  alert(crazyText);
}