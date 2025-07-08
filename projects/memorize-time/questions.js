//Sounds stuff
var correctAnswerSound = new Audio("https://cdn.glitch.global/8d96a941-c2e1-4ece-ae9d-120d5880ab54/correct.mp3?v=1724896809943");
var incorrectAnswerSound = new Audio("https://cdn.glitch.global/8d96a941-c2e1-4ece-ae9d-120d5880ab54/wrong-answer.mp3?v=1724896813220");
function playSound(soundNumber){
  if(soundNumber == 0){
    correctAnswerSound.currentTime=0;
    correctAnswerSound.play();
  }else if(soundNumber == 1){
    incorrectAnswerSound.currentTime=0;
    incorrectAnswerSound.play();
  }
}

//Go to quizlet stack -> three dots -> export ->|, newline -> copy text, and paste here

let mandarinSet =`申请|to apply (for); application
专业|major
工程|engineering
历史|history; historical
数学|Math
科学|science; scientific
打算|to plan; planning to
研究|to study，research
有用|useful; effective
工作|job; work;
实习|to practice, to intern
参观|to visit, to tour
开学|school starts
开车|driving
帮|to help
义工|volunteer work; to do volunteer work`

let mandarinSet2=`奖学金|scholarship money
推荐信|recommendation letter
排名|Ranking
在乎|to mind, to care
适合|to fit; to suit
优点|strong point, advantage
缺点|weakness, fault
考虑|to consider, think over
选择|choice, to choose
私立|private run
州立|state run
机会|opportunity
比例|proportion, scale ratio`

let mandarinSet3 = `一首老歌|Old Song
团圆|Reunion
看法|Opinion
心情|Feeling
代表|Represents
月亮|Moon
爱|Love
心|Heart
吻|Kiss`

let mandarinSet4 = `月光|moonlight
团圆|reunion
静夜|Quiet Night
举头|Raise Head
故乡|Hometown
农历|Lunar Calendar
代表|Represents
心|Heart
庆祝|Celebrate
多深|How deep
八月十五号|When is 中秋节日 celebrated
传统|Tradition
深深的|deep，profound
长生不老|Immortal
感恩节|Thanksgiving
看法|perspective
月饼|Moon Cake
玉兔|Jade Rabbit
放灯笼|Light Lanturns
灯笼|Lanturns
静夜思|Thoughts on a quiet night
舞狮|Lion Dance
传说|Legend
一个吻|A kiss
全家团圆|Family Reunion
砍树|Cut tree
玉帝|Jade Emperor
神仙|Immortal/God
丈夫|Husband
妻子|Wife
唐代|Tang Dynasty
节日|Festival
相信|Believe
神话|Mythology
故事|Story
园|Circular`

let historySet = `Democracy|Government by the people, both directly or indirectly, with free and frequent elections.
Representative democracy|Government in which the people elect those who govern and pass laws; also called a republic.
Bicameralism|The principle of a two-house legislature.
Federalists|Supporters of ratification of the Constitution and of a strong central government.
Antifederalists|Opponents of ratification of the Constitution and of a strong central government, generally.
Separation of powers|Constitutional division of powers among the legislative, executive, and judicial branches, with each branch having distinct roles.
Checks and balances|Constitutional grant of powers that enables each branch of government to check some acts of the others to prevent dominance.
Divided government|Governance divided between parties, especially when one holds the presidency and the other controls Congress.
Direct primary|Election where voters choose party nominees.
Initiative|Procedure allowing voters to propose laws or constitutional amendments by petition.
Judicial review|Power of a court to refuse to enforce a law or government regulation conflicting with the Constitution.
Impeachment|Formal accusation by the lower house of legislature against a public official, initiating removal from office.
Executive order|Directive with the force of law issued by a president or governor.
Executive privilege|Power to keep executive communications confidential, especially in matters of national security.
Federalism|Constitutional arrangement distributing power between central and state governments.
Unitary system|Constitutional arrangement concentrating power in a central government.
Confederation|Constitutional arrangement where sovereign states create a central government with limited power over individuals.
Expressed powers|Powers specifically granted to branches of the national government by the Constitution.
Implied powers|Powers inferred from expressed powers allowing Congress to carry out functions.
Necessary and proper clause|Clause granting Congress additional powers beyond its express powers to carry out Constitution-vested powers.
Commerce clause|Clause giving Congress power to regulate business activities crossing state lines or affecting multiple states or nations.
Federal mandate|Requirement imposed by the federal government as a condition for receiving federal funds.
Concurrent powers|Powers granted to both national and state governments, like the power to levy taxes.
Fiscal federalism|Distribution of power through grant programs, complicating government function differentiation.
Linkage institutions|Means for individuals to express preferences on public policy development.
Political culture|Shared beliefs, values, and norms about citizen-government and citizen-citizen relationships.
Political ideology|Consistent beliefs on political values and government's role.
Liberalism|Belief that government can and should achieve justice and equality of opportunity.
Conservatism|Belief that limited government ensures order, competitive markets, and personal opportunity.
Pluralism|Government theory where multiple competing groups prevent one group from asserting excessive power.
Interest group|Collection of people sharing common interests seeking to influence government for specific ends.
Political party|Organization aiming for political power by electing officials to implement its policies.
Patronage|Dispensing government jobs to winning political party members.
Independent expenditure|Unlimited spending by individuals, groups, or parties in campaigns for or against candidates, operating independently.
Caucus|Local party meeting to choose officials or candidates and decide the party's platform.
Open primary|Primary election allowing any voter, regardless of party, to vote.
Closed primary|Primary election where only registered party members can vote.
Winner-take-all system|Election system where the candidate with the most votes wins.
Minor party|Small political party dependent on a charismatic candidate or persistent ideologies.
De-alignment|Weakening of partisan preferences, leading to rejection of major parties and rise in independents.
Popular sovereignty|Government based on people's consent, with authority from the people.
Political socialization|Process, notably in families and schools, developing political attitudes, values, and beliefs.
General election|Elections where voters choose officeholders.
Midterm election|Elections held between presidential elections.
Single-member district|Electoral district where voters choose one representative.
Electoral college|System electing president and vice president through electors voting for party candidates.
Coattail effect|Boost in candidates' popularity due to higher-ranked candidates on the ballot.
Bipartisanship|Policy emphasizing unity and cooperation between major political parties.
Bill of Attainder|Legislative act declaring a person guilty of treason or felony without trial.
Ex Post Facto|Law making an act illegal after it was committed, punishing past offenders.
Habeas Corpus|Court order requiring justification for an individual's detention.
Reserved powers|Powers granted to states by the 10th amendment as not given to the national government.
Grassroots mobilization|Community-based organization for social, political, or economic change.
Two-party system|Electoral system with two dominant parties competing nationally.
Constituent|Residents of a congressional district or state.
Incumbent|Current officeholder.
Superdelegate|Party leaders and officials becoming national convention delegates without running in primaries.
Agenda setting|Process of forming government issue lists to address.`

let polyatomicSet = `Ammonium|NH4+
Acetate|CH3COO-
Cyanide|CN-
Hydroxide|OH-
Nitrate|NO3-
Nitrite|NO2-
Hypochlorite|ClO-
Chlorite|ClO2-
Chlorate|ClO3-
Perchlorate|ClO4-
Permanganate|MnO4-
Bicarbonate|HCO3-
Dihydrogen Phosphate|H2PO4-
Carbonate|CO32-
Sulfate|SO42-
Sulfite|SO32-
Chromate|CrO42-
Dichromate|2Cr072-
Hydrogen Phosphate|HPO42-
Phosphate|PO43-`

let polyatomicSet2 = `NH4+|Ammonium
CH3COO-|Acetate
CN-|Cyanide
OH-|Hydroxide
NO3-|Nitrate
NO2-|Nitrite
ClO-|Hypochlorite
ClO2-|Chlorite
ClO3-|Chlorate
ClO4-|Perchlorate
MnO4-|Permanganate
HCO3-|Bicarbonate
H2PO4-|Dihydrogen Phosphate
CO32-|Carbonate
SO42-|Sulfate
SO32-|Sulfite
CrO42-|Chromate
Cr2O72-|Dichromate
HPO42-|Hydrogen Phosphate
PO43-|Phosphate`

let mandarinRelativesSet = `Relatives | 亲戚 (qīn qi)
Grandfather and Grandmother (paternal) | 爷爷奶奶 (yé yé nǎi nai)
Grandfather and Grandmother (maternal) | 外公外婆 (wài gōng wài pó)
Older Paternal Uncle | 伯伯 (bó bó)
Younger Paternal Uncle | 叔叔 (shū shū)
Paternal Aunt | 姑姑 (gū gu)
Maternal Uncle | 舅舅 (jiù jiu)
Maternal Aunt | 姨 (yí)
Older Paternal Male Cousin | 堂哥 (táng gē)
Younger Maternal Female Cousin | 表妹 (biǎo mèi)
Ancestors | 祖先 (zǔ xiān)
Bloodline | 血统 (xuè tǒng)
Marriage | 结婚 (jié hūn)
Divorce | 离婚 (lí hūn)
Remarriage | 再婚 (zài hūn)
Twins | 双胞胎 (shuāng bāo tāi)
Half Sibling (same father, different mother) | 同父异母 (tóng fù yì mǔ)
Immigration | 移民 (yí mín)
Nationality | 国籍 (guó jí)
Ethnic Minority | 少数民族 (shǎo shù mín zú)
PhD | 博士 (bó shì)
Academic Background | 学历 (xué lì)
Name | 姓名 (xìng míng)
Gender | 性别 (xìng bié)
Or | 或者 (huò zhě)
Or | 还是 (hái shì)`
let mandarinFriendsSet = `Understand (Liaojie) | 了解
Tell everything (Wuhuabushuo) | 无话不说
Trust (Xinlai) | 信赖
Chat (Liaotian) | 聊天
Behind one's back (Zaibeihou) | 在背后
Secret (Mimi) | 秘密
Be myself (Zuowoziji) | 做我自己
Cry (Ku) | 哭
Laugh (Xiao) | 笑
Support (Zhichi) | 支持
Encourage (Guli) | 鼓励
Badmouth (Shuo...huaihua) | 说…坏话
Each other (Huxiang) | 互相
Care for (Guanxin) | 关心
Make...happy (Rang...kuaile) | 让…快乐
Two-faced person (Shuangmianren) | 双面人
Real (Buzuozuo) | 不做作`
let mandarinFriendsSet2 = `Understand | 了解
Tell everything | 无话不说
Trust | 信赖
Chat | 聊天
Behind one's back | 在背后
Secret| 秘密
Be myself | 做我自己
Cry | 哭
Laugh | 笑
Support | 支持
Encourage | 鼓励
Badmouth | 说…坏话
Each other | 互相
Care for | 关心
Make...happy | 让…快乐
Two-faced person| 双面人
Real | 不做作`
let mandarinLoveSet = `mutual | 互相
support | 支持
care | 关心
care | 在乎
understand | 了解
encourage | 鼓励
trust | 信赖
rely on | 依靠
help | 帮
cry | 哭
laugh | 笑
real | 不做作
trustworthy | 值得信赖
talk about everything | 无话不说
annoying | 烦
ignore | 不理
joke | 笑话
two-faced | 两面人
two-faced | 双面人
badmouth | 说坏话
bad | 坏
happy | 高兴
happy | 开心
happy | 快乐
excited | 兴奋
sad | 难过
heartbroken | 伤心
worried | 担心
hate | 讨厌
afraid | 害怕
disappointed | 失望
angry | 生气
angry | 火大
nervous | 紧张
bored | 无聊
laugh | 笑
cry | 哭
unlucky | 倒霉
too bad | 糟糕
get along | 谈得来
same interests | 兴趣相同
focused | 专心
feel right | 感觉对
mutual attraction | 互相有意思
close friend | 交朋友
platonic friend | 普通朋友
secret | 秘密
be in love | 谈恋爱
break up | 分手
reconcile | 又和好了
partner | 对象
partner | 对方
appearance | 外表
personality | 个性
interest | 兴趣
work ability | 工作能力
income | 收入
family background | 家庭背景
cultural background | 文化背景
love at first sight | 一见钟情
same | 相同
suitable | 适合
important | 重要
blind date | 相亲
well-matched | 门当户对
match | 配
win | 胜
love me, love my dog | 爱屋及乌`

let setDictionary = {};
setDictionary["000000"] = historySet;
setDictionary["000001"] = mandarinSet;
setDictionary["000002"] = mandarinSet2;
setDictionary["000003"] = mandarinSet3;
setDictionary["000004"] = mandarinSet4;
setDictionary["-1"] = polyatomicSet;
setDictionary["-2"] = polyatomicSet2;
setDictionary["mandarinRelatives"] = mandarinRelativesSet;
setDictionary["mandarinFriends"] = mandarinFriendsSet;
setDictionary["mandarinFriends2"] = mandarinFriendsSet2;
setDictionary["mandarinLove"] = mandarinLoveSet;

const setId =  new URLSearchParams(window.location.search).get('id');
console.log(setId);

let questions = setDictionary[setId]

//Proccessing words
if(questions == null){
  alert("Set not found")
  alert("Returning to home")
  window.location = "https://memorize-time.glitch.me"
}

var questionsArray = questions.split("\n");
var longestResponse = 0;
var longestQuestion = 0;

var previousAnswers = []

for (let i = 0; i < questionsArray.length; i++){
  questionsArray[i] = [questionsArray[i].split("|")[0], questionsArray[i].split("|").slice(1).join('|')];
  previousAnswers[i] = [[0,0],[0,0]]//MCQ, FRQ| [wrong, right]
  
  if(questionsArray[i][0].length > longestResponse){
    longestResponse = questionsArray[i][0].length
  }
  if(questionsArray[i][1].length > longestQuestion){
    longestQuestion = questionsArray[i][1].length
  }
}

document.documentElement.style.setProperty("--answerSize", "" + Math.min(5.5,100/longestResponse) + "vmax");
document.documentElement.style.setProperty("--questionSize", "" + Math.min(5.5, 300/longestQuestion) + "vmax");

console.log("Questions imported: " + questionsArray);

var questionID = 0;

function setMCQ(){
  var answerDivElement = document.getElementsByClassName("answers")[0];
  answerDivElement.innerHTML = `<button class = "answer" onclick="checkMCQ(this)">
        <h1 class = "answer-text">
          
        </h1>
      </button>
      <button class = "answer" onclick="checkMCQ(this)">
        <h1 class = "answer-text">
          
        </h1>
      </button>
      <button class = "answer" onclick="checkMCQ(this)">
        <h1 class = "answer-text">
          
        </h1>
      </button>
      <button class = "answer" onclick="checkMCQ(this)">
        <h1 class = "answer-text">
          
        </h1>
      </button>`
  
  var correctID = Math.floor(Math.random() * 4);
  
  var questionTextElement = document.getElementsByClassName("question-text")[0];
  var answerTextElements = document.getElementsByClassName("answer-text");
  
  questionTextElement.innerHTML = questionsArray[questionID][1];
  for (let i = 0; i < answerTextElements.length; i++){
    if(i == correctID){
      answerTextElements[i].innerHTML = questionsArray[questionID][0];
    }else{
      var check = true;
      while(check){
        var checkText = questionsArray[Math.floor(Math.random() * questionsArray.length)][0];
        check = false;
        for (let j = 0; j < answerTextElements.length; j++){
          if(checkText == answerTextElements[j].innerHTML && !(i == j)){
            check = true;
          }
        }
        if(checkText == questionsArray[questionID][0]){
            check = true;
        }
      }
      answerTextElements[i].innerHTML = checkText;
    }
  }
}

function setFRQ(){
  var answerDivElement = document.getElementsByClassName("answers")[0];
  answerDivElement.innerHTML = `
    <input id="written-answer">
  `
  
  var correctID = Math.floor(Math.random() * 4);
  
  var questionTextElement = document.getElementsByClassName("question-text")[0];
  var answerTextElement = document.getElementById("written-answer");
  
  questionTextElement.innerHTML = questionsArray[questionID][1];
  
  answerTextElement.focus();
  
  answerTextElement.onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.code || e.key;
    if (keyCode == 'Enter' && modal.style.display == "none"){
      checkFRQ();
    }
  }
}

var modal = document.getElementById("myModal");

function setModal(text, color){
  document.getElementById("modal-text").innerHTML = text;
  modal.style.display = "block";
  modal.style.color = color;
  
  window.onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.code || e.key;
    if (keyCode == 'Space'){
      modal.style.display = "none"
    }
  }
  
  modal.onclick = function(e){
    modal.style.display = "none"
  }
}

function checkMCQ(element){
  let selectedAnswer = element.children[0].innerHTML;
  
  if(selectedAnswer == questionsArray[questionID][0]){
    previousAnswers[questionID][0][0] += 1;
    playSound(0);
    
    setModal("Correct", "#32e067");
  }else{
    previousAnswers[questionID][0][1] += 1;
    playSound(1);
    
    setModal("Incorrect<br>" + questionsArray[questionID][0], "#e03232");
  }
  
  setQuestion();
}

function checkFRQ(){
  let writtenAnswer = document.getElementById("written-answer").value.trim();
  
  if(writtenAnswer.toLowerCase() == questionsArray[questionID][0].trim().toLowerCase()){
    previousAnswers[questionID][1][0] += 1;
    playSound(0);
    
    setModal("Correct", "#32e067");
  }else{
    previousAnswers[questionID][1][1] += 1;
    playSound(1);
    
    setModal("Incorrect<br>" + questionsArray[questionID][0], "#e03232");
  }
  
  setQuestion();
}

let WRITTEN_BANK_SIZE = 7;
function setQuestion(){
  var frqs = [];
  var mcqs = [];
  var doneQs = [];
  //Sorting questions by proficiency
  for(let i = 0; i < previousAnswers.length; i++){
    if(previousAnswers[i][0][0] < 1){//Question has never been attempted
      mcqs.push(i);
      continue;
    }
    if(previousAnswers[i][0][1] > 0){
      if(previousAnswers[i][0][0] / previousAnswers[i][0][1] <= 1){//<50% accuracy on MCQ
        mcqs.push(i);
        continue;
      }
    }
    
    if(previousAnswers[i][1][1] >= previousAnswers[i][0][0]){//More wrong answers on FRQ than correct on MCQ
      mcqs.push(i);
      continue;
    }
    
    if(previousAnswers[i][1][0] >= 1 && previousAnswers[i][1][1] == 0){//Correct FRQ and no incorrect
      doneQs.push(i);
      continue;
    }
    
    if(previousAnswers[i][1][1] > 0){
      if(previousAnswers[i][1][0] / previousAnswers[i][1][1] >= 1){//More than 50% correct on FRQ
        doneQs.push(i);
        continue
      }
    }
    
    frqs.push(i);
  }
  
  //Chosing a question
  var frqMode = false;
  var lastID = questionID;
  while (questionID == lastID){
    if(Math.random() > 0.95 && doneQs.length > 0){//5% chance to review
      questionID = doneQs[Math.floor(Math.random() * doneQs.length)];
      frqMode = true;
    }else{
      if(frqs.length > 0){
        if(mcqs.length > 0){
          if(Math.random() > (frqs.length - WRITTEN_BANK_SIZE) * 0.1 + 0.5){//If both mcqs and frqs use this to determine which
            questionID = mcqs[Math.floor(Math.random() * mcqs.length)];
            frqMode = false;
          }else{
            questionID = frqs[Math.floor(Math.random() * frqs.length)];
            frqMode = true;
          }
        }else{//only frqs
          questionID = frqs[Math.floor(Math.random() * frqs.length)];
          frqMode = true;
        }
      }else if(mcqs.length > 0){//only mcqs
        questionID = mcqs[Math.floor(Math.random() * mcqs.length)];
        frqMode = false;
      }else{//only doneQs
        questionID = doneQs[Math.floor(Math.random() * doneQs.length)];
        frqMode = true;
      }
    }  
  }
  console.log("Giving Question: " + questionID);
  if(frqMode){
    setFRQ();
  }else{
    setMCQ();
  }
}

setQuestion();