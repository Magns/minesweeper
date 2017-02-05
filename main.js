/*
						-- GAME --
*/
var Game = function(level) {
	this.active = true;

	map = new Map({
		board: document.getElementById('board'), 
		width: level.width,
		height: level.height,
        mines: level.mines
	});
    
	hideNew();
};
Game.prototype.over = function() {
	this.active = false;
	
	var board = document.getElementById('board');
	var popup = document.createElement('div');
	popup.id = "popup";
	popup.className = "gameover"
	popup.innerHTML = "Game over";
	board.insertBefore(popup, board.firstChild);
	
	ga('send', 'event', 'Minesweeper', 'Lose');
};
Game.prototype.win = function() {
	this.active = false;

	var board = document.getElementById('board');
	var popup = document.createElement('div');
	popup.id = "popup";
	popup.className = "success"
	popup.innerHTML = "Congratulations!";
	board.insertBefore(popup, board.firstChild);
	
	ga('send', 'event', 'Minesweeper', 'Win');
};



/*
						-- MAP --
*/
var Map = function (options) {
	this.board = options.board;
	this.width = options.width || 12;
	this.height = options.height || 11;
	this.tileSize = options.tileSize || 25;
    this.mines = options.mines || 5;
    this.map = [];
    
    // Create empty board
    for (var i=0; i<this.width*this.height; i++) {
	   this.map.push(new Tile({
		  mine: 	false,
		  x: 		i%this.width,
		  y: 		Math.floor(i/this.width)
	   }));
    }
    
    // Sprinkle in mines
    if (this.mines <= this.map.length) {
        for (var i=0; i<this.mines; i++) {
            var mined = false;
            while (!mined) {
                var t = this.map[Math.floor(Math.random()*this.map.length)];
                if (!t.mine) {
                    t.mine = true;
                    mined = true;
                }
            }
        }    
    } else {
        console.log("Too many mines!");
    }
    
	this.board.style.width = this.width * this.tileSize + 'px';
	this.build(this.board);
};
// Get tile from map using coordinates or index
Map.prototype.getTile = function (x, y) {
	// If only X is set, return from array index
	if(typeof y === "undefined") {
		return this.map[x];
	}
	
	// Else return from coordinates
	if(x >= this.width || x<0 
	|| (x+y*this.width) >= this.map.length || y<0) {
		return -1;
	}
	return this.map[x + y*this.width];
};
// Build game board
Map.prototype.build = function () {
	this.board.innerHTML = '';
	for (var y=0; y<this.height; y++) {
		var row = document.createElement('div');
		row.className = 'row';

		// Row numbers
		var coordCell = document.createElement('div');
		coordCell.className = "coordCell";
		coordCell.innerText = this.height-y;
		row.appendChild(coordCell);

		for(var x=0; x<this.width; x++) {
			var tile;
			tile = document.createElement('div');
			tile.className = 'tile';
			tile.id = 'tile-'+x+'-'+y;
			row.appendChild(tile);
			
			var tileObj = this.getTile(x,y);
			(function (that) {
				tile.addEventListener("click", function() {
					that.check();
				});
			})(tileObj);
		}
		this.board.appendChild(row);
	}
	
	// Very last row
	var row = document.createElement('div');
	row.className = 'row';
	// Add column letters
	var letters = " ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ!?@#+*";
	for(var i=0; i<this.width+1; i++){
		var coordCell = document.createElement('div');
		coordCell.className = "coordCell";
		coordCell.innerHTML = letters[i];
		row.appendChild(coordCell);
	}
	this.board.appendChild(row);
	
	for(var i=0; i<this.map.length; i++) {
		var t = this.getTile(i);
		t.dom = document.getElementById('tile-'+t.x+'-'+t.y);
	}
};
// How many tiles without mines are left?
Map.prototype.progress = function() {
    var totalSafe = this.map.length - this.mines;
    var revealed = 0;
    for (var i=0; i<this.map.length; i++){
        t = this.map[i];
        if(!t.hidden && !t.mine) {
            revealed++;
        }
    }
	return totalSafe-revealed;
};


/*
						-- TILE --
*/
var Tile = function(obj) {
	this.mine = obj.mine;
	this.hidden = true;
	this.x = obj.x;
	this.y = obj.y;
	this.dom;
	this.flagged = false;
};
Tile.prototype.check = function() {
	if(game.active) {
		if(flagging && this.hidden || this.flagged) {
			this.flag();
		} else {
			this.reveal();
		}
	}
};
Tile.prototype.reveal = function() {
	this.hidden = false;
	var near = this.nearby();
	this.dom.className = "tile revealed";
	
	// if 0, check all nearby
	if (near == 0) {
		for(var y=-1; y<=1; y++) {
			for(var x=-1; x<=1; x++) {
				var t = map.getTile(this.x+x, this.y+y);
				if(t.hidden && !(x == 0 && y == 0)) {
					t.check();
				}
			}
		}
	}
	
	// No text for 0 nearby mines
	if(near != 0) {
		this.dom.innerText = near;
	} else {
		this.dom.innerText = '';
	}
	
	// OOPS! Mine!
	if(this.mine) {
		for (var i=0; i<map.map.length; i++) {
			var t = map.map[i];
			if(t.mine) {
				t.dom.innerText = '💣';
				t.dom.className = "tile mine";
			}
		}
		game.over();
	}
    
    // Did I win!?
    if(map.progress() === 0) {
        game.win();
    }
};
Tile.prototype.flag = function() {
	if(!this.flagged) {
		this.flagged = true;
		this.dom.innerText = "🚩";
		this.dom.className = "tile flagged";
	} else {
		this.flagged = false;
		this.dom.innerText = "";
		this.dom.className = "tile";
	}
};
Tile.prototype.nearby = function() {
	var mines = 0;
	for(var y=-1; y<=1; y++) {
		for(var x=-1; x<=1; x++) {
			t = map.getTile(this.x+x, this.y+y);
			if(t != -1 && !(x == 0 && y == 0)) {
				if(t.mine) {
					mines++;
				}
			}
		}
	}
	return mines;
};



/*
                        -- Event listeners --
*/

var btn_new = document.getElementById('btn-new');
    var btn_easy = document.getElementById('btn-easy');
    var btn_mid = document.getElementById('btn-mid');
    var btn_hard = document.getElementById('btn-hard');

var btn_flag = document.getElementById('flag');


btn_new.addEventListener('click', function() {
	document.getElementById('dropdown1').classList.toggle("hidden");
	document.getElementById('btn-new').classList.toggle("active");
});

btn_easy.addEventListener('click', function() {
    game = new Game(level_easy);
	ga('send', 'event', 'Minesweeper', 'New game', 'Easy');
});

btn_mid.addEventListener('click', function() {
    game = new Game(level_mid);
	ga('send', 'event', 'Minesweeper', 'New game', 'Medium');
});

btn_hard.addEventListener('click', function() {
    game = new Game(level_hard);
	ga('send', 'event', 'Minesweeper', 'New game', 'Hard');
});

btn_flag.addEventListener('click', function() {
    toggleFlag();
});


document.addEventListener('keydown', function(e) {
    // SHIFT key
    if(e.keyCode == 16) {
		toggleFlag(true);
	}
});

document.addEventListener('keyup', function(e) {
	// SHIFT key
    if(e.keyCode == 16) {  
		toggleFlag(false);
	}
});



/*
						-- Flagging --
*/

var flagging = false;
function toggleFlag(bool) {
	if (typeof bool === "undefined") {
        flagging = !flagging;
    } else {
        flagging = bool;
    }
	if(flagging) {
		document.querySelector('.container').classList.add("flagging");
    	document.getElementById('flag').classList.add("active");
	} else {
		document.querySelector('.container').classList.remove("flagging");
        document.getElementById('flag').classList.remove("active");
	}
}



/*
						-- Blablabla --
*/

function hideNew() {
	document.getElementById('dropdown1').className = "dropdown hidden";
	document.getElementById('btn-new').className = "menubutton";
}



/*
                        -- init --
*/

var level_easy = {
    width: 9,
	height: 9,
	mines: 8
};

var level_mid = {
    width: 12,
	height: 12,
	mines: 20
};

var level_hard = {
    width: 16,
	height: 12,
	mines: 30
};

var map;
var game;

game = new Game(level_easy);

ga('send', 'event', 'Minesweeper', 'Init');