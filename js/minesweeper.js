
const DIFFICULTIES = [
    {
        columns: 9,
        rows: 9,
        defaultMineAmount: 10,
    },
    {
        columns: 16,
        rows: 16,
        defaultMineAmount: 40,
    },
    {
        columns: 30,
        rows: 16,
        defaultMineAmount: 99,
    },
];
const GAME_STATUSES = {
    'ONGOING': 'ONGOING',
    'VICTORY': 'VICTORY',
    'DEFEAT': 'DEFEAT'
}
const SAFE_TILE_TYPES = ["tile", "tile_1", "tile_2", "tile_3", "tile_4", "tile_5", "tile_6", "tile_7", "tile_8"]
const NONCLICKABLE_TILES_BASE = ["mine", "mine_hit", "mine_marked", "tile_1", "tile_2", "tile_3", "tile_4", "tile_5", "tile_6", "tile_7", "tile_8"];
const NONCLICKABLE_TILES_EXTENDED = ["flag"].concat(NONCLICKABLE_TILES_BASE)


let gameStatus;
let selectedDifficulty;
let remainingMines;
let tilesWithMines = new Set();
let allTiles = new Set();
let timeValue = 0;
window.setInterval(onTimerTick, 1000);

function randomlyPlantMines(tilePosition) {
    const initialSafeArea = getAdjascents(tilePosition).map(item => getPositionId(item))
    initialSafeArea.push(getPositionId(tilePosition))

    while (tilesWithMines.size < selectedDifficulty.defaultMineAmount) {
        const pos = {x: Math.floor(Math.random() * selectedDifficulty.rows), y: Math.floor(Math.random() * selectedDifficulty.columns)}
        if(!initialSafeArea.includes(getPositionId(pos))) tilesWithMines.add(getPositionId(pos))
    }
    timeValue = 0;
    console.log(tilesWithMines);
}

function buildGrid() {

    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    // Build DOM Grid
    var tile;
    for (let x = 0; x < selectedDifficulty.rows; x++) {
        for (let y = 0; y < selectedDifficulty.columns; y++) {
            const position = {x,y}
            allTiles.add(getPositionId(position));
            tile = createTile(position);
            grid.appendChild(tile);
        }
    }
    
    var style = window.getComputedStyle(tile);
    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));
    grid.style.width = (selectedDifficulty.columns * width) + "px";
    grid.style.height = (selectedDifficulty.rows * height) + "px";
}

function createTile(position) {
    function addStyle(nextStyle) {
        tile.classList.remove("hidden");
        tile.classList.add(nextStyle);
    }
    function toggleStyle(nextStyle) {
        tile.classList.toggle(nextStyle);
        if(tile.classList.contains("flag")) {
            updateRemainingMineCount(remainingMines-1)
        } else {
            updateRemainingMineCount(remainingMines+1)
        }
    }
    function removeStyle(styleToRemove) {
        tile.classList.remove(styleToRemove);
    }
    const positionId = getPositionId(position);
    const tileProps = {
        position,
        positionId,
        addStyle,
        toggleStyle,
        removeStyle
    }


    var tile = document.createElement("div");

    tile.id = positionId;
    tile.classList.add("tile");
    tile.classList.add("hidden");
    
    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mouseup", function (e) { handleTileClick(e, tileProps); }); // All Clicks

    return tile;
}
function getPositionId(position) {
   return  `${position.x}-${position.y}`
}

function startGame() {
    setDifficulty()
    updateSelectedLevel()
    reset()
    buildGrid();
}

function reset() {
    timeValue = 0;
    updateTimer();
    tilesWithMines.clear();
    allTiles.clear()
    console.log(tilesWithMines);
    gameStatus = GAME_STATUSES.ONGOING;
    document.getElementById("stat").innerHTML = "";
    removeSmileyStatus("face_lose")
    removeSmileyStatus("face_win")
    updateRemainingMineCount(selectedDifficulty.defaultMineAmount)
}


function addSmileyStatus(emotion) {
    var smiley = document.getElementById("smiley");
    smiley.classList.add(emotion);
}
function removeSmileyStatus(emotion) {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove(emotion);
}

function handleTileClick(event, tile) {
    if (gameStatus !== GAME_STATUSES.ONGOING) return;
    switch (event.which) {
        case 1:
            if(!tilesWithMines.size) randomlyPlantMines(tile.position)
            leftClickHandler(tile)
            break;
        case 2:
            if (!tilesWithMines.size) randomlyPlantMines(tile.position)
            middleClickHandler(tile)
            break;
        case 3:
            rightClickHandler(tile)
            break;
        default:
            break;
    }
    checkGameStatus()
}
function checkGameStatus() {
    if (compareSets(tilesWithMines, allTiles)) {
        addSmileyStatus("face_win")
        gameStatus = GAME_STATUSES.VICTORY;
        showResult()
    }
}


function leftClickHandler(tile) {
    const notClickable = checkClickable(tile, NONCLICKABLE_TILES_EXTENDED)
    if (notClickable) return;
    console.log("current mine position", tile.positionId);
    if(tilesWithMines.has(tile.positionId)) {
        tile.addStyle("mine_hit")
        defeated()
        return;
    }
    const tileStyle = checkAdjascents(tile.position)
    tile.addStyle(tileStyle)
    allTiles.delete(getPositionId(tile.position))

}
function checkClickable(tile, nonclickables) {
    const tileClasses = document.getElementById(tile.positionId).classList;
    return nonclickables.some(r => tileClasses.contains(r))
}
function defeated() {
    addSmileyStatus("face_lose")
    gameStatus = GAME_STATUSES.DEFEAT;
    showResult()
}

function middleClickHandler(tile) {
    const notClickable = checkClickable(tile, NONCLICKABLE_TILES_EXTENDED)
    if (notClickable) return;
    console.log("middle click", tile.positionId);
    if (tilesWithMines.has(tile.positionId)) {
        tile.addStyle("mine_hit")
        defeated()
        return;
    }
    const tileStyle = checkAdjascents(tile.position)
    tile.addStyle(tileStyle)
    allTiles.delete(getPositionId(tile.position))
    if (tileStyle === SAFE_TILE_TYPES[0]) {
        revealAdjascents(tile.position)
    }
    
}
function rightClickHandler(tile) {
    if (!tilesWithMines.size) return
    const notClickable = checkClickable(tile, NONCLICKABLE_TILES_BASE)
    if (notClickable) return;
    console.log("right click", tile.positionId);
    tile.toggleStyle("flag")
}

function checkAdjascents(tilePosition) {
    let nearbyMineCount = 0;
    const adjascents = getAdjascents(tilePosition);
    for (let j = 0; j < adjascents.length; j++) {
        if(tilesWithMines.has(getPositionId(adjascents[j]))) nearbyMineCount++
    }
    return SAFE_TILE_TYPES[nearbyMineCount]
}
function revealAdjascents(tilePosition) {
    const adjascents = getUnpressedAdjascents(tilePosition);
    for (let j = 0; j < adjascents.length; j++) {
        if(!tilesWithMines.has(getPositionId(adjascents[j]))) {
            const tileStyle = checkAdjascents(adjascents[j])
            const tilePositionId = getPositionId(adjascents[j]);
            const relatedTile = document.getElementById(tilePositionId).classList
            relatedTile.remove("hidden")
            relatedTile.add(tileStyle)
            allTiles.delete(tilePositionId)
            if(tileStyle === SAFE_TILE_TYPES[0]) {
                revealAdjascents(adjascents[j])
            }
        }

    }
}

function getUnpressedAdjascents(tilePosition) {
    const adjascents = getAdjascents(tilePosition)
    const res = adjascents.filter(isTileRevealed);
    return res;
}


function isTileRevealed(tilePosition) {
    const tileClasses = document.getElementById(getPositionId(tilePosition)).classList;
    return tileClasses.contains("hidden")
}

function getAdjascents(position) {

    const potentialTiles = [
        {x: position.x, y: position.y+1 }, // down
        {x: position.x-1, y: position.y+1 }, // down left
        {x: position.x+1, y: position.y+1 }, // down right
        {x: position.x, y: position.y-1 }, // up
        {x: position.x-1, y: position.y-1 }, // up left
        {x: position.x+1, y: position.y-1 }, // up right
        {x: position.x-1, y: position.y }, // left
        {x: position.x+1, y: position.y }, // right
    ];
    const asd = potentialTiles.filter(isPotentialAdjascentPositionValid)
    return asd;

}

function isPotentialAdjascentPositionValid(pos) {
    return ((pos.x >= 0) && (pos.y >= 0) && (pos.x < selectedDifficulty.rows) && (pos.y < selectedDifficulty.columns));
}



function setDifficulty() {
    var difficultySelector = document.getElementById("difficulty");
    selectedDifficulty = DIFFICULTIES[difficultySelector.selectedIndex]
}



function onTimerTick() {
    if(gameStatus === GAME_STATUSES.ONGOING && tilesWithMines.size) {
        timeValue++;
        updateTimer();
    }
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}

function updateRemainingMineCount(newAmount) {
    remainingMines = newAmount;
    document.getElementById("flagCount").innerHTML = newAmount;
}
function updateSelectedLevel() {
    const selectedLevelText = `${selectedDifficulty.columns}x${selectedDifficulty.rows} `
    document.getElementById("selectedLevel").innerHTML = selectedLevelText;
}
function showResult() {
    let message = "You Lost :/";
    if(gameStatus === GAME_STATUSES.VICTORY) {
        message = `You Won ! Score: ${timeValue}`
    }
    document.getElementById("stat").innerHTML = message;
}



function compareSets(setA, setB){
    return setA.size === setB.size && [...setA].every(value => setB.has(value));
}