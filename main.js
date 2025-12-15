import questionsTxt from '/questions.txt';

let SLICE_ANGLE = 3;
let currentRotation = 0;
let seenQuestions = new Set();
let questions = [];
let rotationStep = 0;
let remaining = 7;
let points = 0;
let dragging = false;
let markerAngle = 0;

const BASE_SLICE_ANGLE = 5;
const BASE_FONT_SIZE = 40;

const dial = document.getElementsByClassName("dial")[0];
const marker = document.getElementsByClassName("marker")[0];

const gameButton = document.getElementById("question")
const GameState = {
    NEW_QUESTION: 0,
    HIDE: 1,
    REVEAL: 2,
    NEW_GAME: 3
}
let currentGameState = GameState.NEW_QUESTION;



fetch('/questions.txt')
  .then(res => res.text())
  .then(csvText => {
      const rows = csvText.trim().split('\n');
      questions = rows.map(row => row.split(':'));
  })
  .catch(err => console.error(err));

  updateDifficulty(3);

window.addEventListener('load', () => {
   createSegments();

    document.getElementById("question").addEventListener( "click", () => manageGameState());
    document.getElementById("difficultySlider").addEventListener("input", (e) => updateDifficulty(e.target.value))
    document.getElementById("customDifficulty").addEventListener("input", (e) => updateDifficulty(e.target.value))
    
});

function createSegments(){
    const dialWidth = dial.offsetWidth;
    const halfWidth = (SLICE_ANGLE / 100) * dialWidth;
    const radius = dialWidth / 2;
    rotationStep = 2 * Math.atan(halfWidth / radius) * (180 / Math.PI);
    let currentAngle = -rotationStep*2;
    const points = [2,3,4,3,2];
    
    for(let point of points){
        createSlices(currentAngle, point)
        createSlices(currentAngle + 180, point)
        currentAngle += rotationStep;
    }
}

function getAngleFromEvent(e) {
    const rect = dial.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if (e.touches) { // touch event
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else { // mouse event
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // top = 0°
    
    // Clamp to top half of dial
    if (angle < -90 || angle > 180) angle = -90;
    if (angle > 90 && angle < 180) angle = 90;

    return angle;
}

// Start dragging marker
function startDrag(e) {
    e.preventDefault();
    dragging = true;
    markerAngle = getAngleFromEvent(e);
    marker.style.transform = `translate(-50%, 0) rotate(${markerAngle}deg)`;
}

// Stop dragging marker
function stopDrag(e) {
    dragging = false;
}

// Drag move
function dragMove(e) {
    if (!dragging) return;
    markerAngle = getAngleFromEvent(e);
    marker.style.transform = `translate(-50%, 0) rotate(${markerAngle}deg)`;
}

// Attach events
window.addEventListener("mousemove", dragMove);
window.addEventListener("touchmove", dragMove, { passive: false });

window.addEventListener("mouseup", stopDrag);
window.addEventListener("touchend", stopDrag);

marker.addEventListener("mousedown", startDrag);
marker.addEventListener("touchstart", startDrag, { passive: false });

// Click / touch on dial to pick up marker
dial.addEventListener("mousedown", startDrag);
dial.addEventListener("touchstart", startDrag, { passive: false });

function createSlices(angle, points){
    const slice = document.createElement("div");
    slice.classList.add("segment");
    slice.style.background = `var(--points-${points}-color)`;
    slice.style.clipPath = `polygon(50% 50%, ${50 - SLICE_ANGLE}% 0%, ${50 + SLICE_ANGLE}% 0)`;
    console.log(SLICE_ANGLE);
    slice.style.transform = `rotate(${angle}deg)`;

    const label = document.createElement("span");
    label.style.fontSize = `${BASE_FONT_SIZE * (SLICE_ANGLE / BASE_SLICE_ANGLE)}px`;
    label.classList.add("label");
    label.innerHTML = points;
    slice.appendChild(label);
    dial.appendChild(slice);
}

function manageGameState(){
    if(currentGameState === GameState.NEW_QUESTION)
        getNewQuestion();
    else if(currentGameState === GameState.HIDE)
        hideDial();
    else if(currentGameState === GameState.REVEAL)
        revealDial();
    else if(currentGameState === GameState.NEW_GAME){
        startNewGame();
    }
   
}

function getNewQuestion(){
    let newQuestion;
    remaining--;
    gameButton.disabled = true;

    while(true){
        newQuestion = Math.floor(Math.random() * questions.length);
        if(!seenQuestions.has(newQuestion)){
            seenQuestions.add(newQuestion);
            break;
        }
        
    }

    document.getElementById("leftOption").innerHTML = questions[newQuestion][0];
    document.getElementById("rightOption").innerHTML = questions[newQuestion][1];
    if(remaining === 0)
        document.getElementById("remaining").innerHTML = `POZOSTAŁO: OSTATNIA RUNDA`;
    else
        document.getElementById("remaining").innerHTML = `POZOSTAŁO: ${remaining}`;

    const spins = Math.floor(Math.random() * 3) + 2; // 2–4 spins
    const randomOffset = Math.floor(Math.random() * 360);
    const targetRotation = currentRotation + ((spins * 360) + randomOffset);

    const animation = dial.animate(
        [
            { transform: `rotate(${currentRotation}deg)` },
            { transform: `rotate(${targetRotation}deg)` }
        ],
        {
            duration: 2400,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards'
        }
    );
    animation.onfinish = () => {
        gameButton.disabled = false;
    };
 
    currentRotation = ((targetRotation + 90) % 180) - 90;
    currentGameState = GameState.HIDE;
    gameButton.innerHTML = "ZAKRYJ";
}

function hideDial(){
    gameButton.disabled = true;
    const hideOverlay = document.getElementsByClassName("hide")[0];
    const hideOverlayAnimation = hideOverlay.animate(
        [
            { transform: "rotate(0deg)" },
            { transform: "rotate(-180deg)", offset: 0.85 },
            { transform: "rotate(-170deg)", offset: 0.93 },
            { transform: "rotate(-179.9deg)" }
        ],
        {
            duration: 900,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        }
    );
    dial.animate(
        [
            { opacity: 1 },
            { opacity: 0.5, offset:0.9},
            { opacity: 0 }
        ],
        {
            duration: 900,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        }
    )

    hideOverlayAnimation.onfinish = () => {
        gameButton.disabled = false;
    }
    currentGameState = GameState.REVEAL;
    gameButton.innerHTML = "POKAŻ";

}

function revealDial(){
    gameButton.disabled = true;
    const hideOverlay = document.getElementsByClassName("hide")[0];
    const hideOverlayAnimation = hideOverlay.animate(
        [
            { transform: "rotate(-180deg)" },
            { transform: "rotate(0deg)", offset: 0.85 },
            { transform: "rotate(-10deg)", offset: 0.93 },
            { transform: "rotate(0deg)" }
        ],
        {
            duration: 900,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        }
    );
    const dialShow = dial.animate(
        [
            { opacity: 0 },
            { opacity: 0.5, offset:0.6},
            { opacity: 1 }
        ],
        {
            duration: 900,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        }
    )
    hideOverlayAnimation.onfinish = () => {
        const diff1 = Math.abs(markerAngle - currentRotation);
        const diff2 = 180 - diff1; // The "other way around" the semicircle
        const diff = Math.min(diff1, diff2);
        
        if(diff <= rotationStep/2){  
            points += 4;
            document.getElementById("remaining").innerHTML = `POZOSTAŁO: ${++remaining}`;
        }
        else if(diff <= rotationStep * 1.5){ 
            points += 3;
        }
        else if(diff <= rotationStep * 2.5) {
            points += 2;
        }
        document.getElementById("points").innerHTML = `PUNKTY: ${points}`;
        gameButton.disabled = false;
    }


    if(remaining === 0){
        currentGameState = GameState.NEW_GAME;
        gameButton.innerHTML = "NOWA GRA";
    }
    else{
        currentGameState = GameState.NEW_QUESTION;
        gameButton.innerHTML = "LOSUJ";
    }
}

function startNewGame(){
    remaining = 7;
    currentRotation = 0;
    points = 0;
    seenQuestions = new Set();
    rotationStep = 0;
    markerAngle = 0;

    document.getElementById("remaining").innerHTML = `POZOSTAŁO: ${remaining}`;
    document.getElementById("points").innerHTML = `PUNKTY: ${points}`;
    currentGameState = GameState.NEW_QUESTION;
    gameButton.innerHTML = "LOSUJ";
    gameButton.disabled = false;

    dial.getAnimations().forEach(anim => anim.cancel());
    marker.getAnimations().forEach(anim => anim.cancel());
    const hideOverlay = document.getElementsByClassName("hide")[0];
    hideOverlay.getAnimations().forEach(anim => anim.cancel());
    
    dial.style.transform = `rotate(0deg)`;
    marker.style.transform = `translate(-50%, 0) rotate(0deg)`;
    hideOverlay.style.transform = `rotate(0deg)`;
    
    dial.style.opacity = '1';

    while(dial.firstChild)
        dial.removeChild(dial.firstChild);

    dial.getBoundingClientRect();
    createSegments();
}
window.startNewGame = startNewGame;

function updateDifficulty(val){
    val = val > 17 ? 17 : val;
    const slider = document.getElementById("difficultySlider");
    const customDifficulty = document.getElementById("customDifficulty");
    const difficultyLabel = document.getElementById("difficultyName");

    const difficultyName = {
        1: "Bardzo Trudny",
        2: "Trudny",
        3: "Normalny",
        4: "Łatwy",
        5: "Bardzo Łatwy"
    }

    slider.value = val;
    customDifficulty.value = val;
    if(val < 1)
        difficultyLabel.innerHTML = difficultyName[1];
    else if(val > 5)
        difficultyLabel.innerHTML = difficultyName[5];
    else
        difficultyLabel.innerHTML = difficultyName[val];

    SLICE_ANGLE = +val;
}