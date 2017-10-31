///////////////////////////////////////////////////////////////////////////////////////////////////
// zaun.js - CSE 380 Final Project												 	 		 	 //
//																								 //
// This source file contains handling and creating the Zaun character. It contains the AI for    //
// the character, as well as loading all animations, and handling all interactions with the 	 //
// environment and other NPCs.																	 //
//																							     //
// (c) 2017 Team Protector																		 //
//																								 //
// Authors: Daniel Gomm, Noam Dorogoyer, Tristen Terracciano									 //
//																								 //
///////////////////////////////////////////////////////////////////////////////////////////////////

//Ensure global game object is defined
var ProtectorGame = ProtectorGame || {};

//Instantiate the zaun object inside of the global game object
ProtectorGame.zaun = {};

//global object containing a reference to the player character
ProtectorGame.player;

ProtectorGame.zaun.health = 100;
ProtectorGame.zaun.energy = 100;
ProtectorGame.zaun.invincible = false;
ProtectorGame.zaun.collectedAntidotes = 0;

//id for energy restore timer
ProtectorGame.zaun.timerId;

//add variables we might need for later.
var currentlyMoving = false;
var vel = 80; // tristen's machine is 25, 'cause he sucks. But try something like 80 instead 
var random = false; 
var currentPath = [];
var savedPath = [];
var showTile;
var targetX = -1;
var targetY = -1;
var MAX_ERROR = 3;
var dir = "up";

var targetTileX;
var targetTileY;
var playerBlockedTiles = [];

var followingRoad = false;
var traveledRoads = [];
var roadResetId;
var roadReset = false;
var roadFollowEnable = true;
var pathFindEnable = true;
/*
	This function initializes the character, Zaun. This will load the images for the player into the game.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> All images loaded into the game.
*/
ProtectorGame.zaun.initialize = function(game)
{
	console.log("<Zaun> initializing. . .");
	
	//load spritesheet
	game.load.spritesheet('player', 'assets/64px/ZombieSpritesheet.png', 64, 64);
	
	console.log("<Zaun> done.");
}

ProtectorGame.zaun.create = function(game)
{
	//var start = ProtectorGame.map_controller.findObjectsByType('playerStart', ProtectorGame.map_controller.map, 'objectLayer');

	//add zaun 
	//ProtectorGame.player = game.add.sprite(384, 256, 'player');
	//console.log("startx,y: " + start[1].x + " , " + start[1].y);
	ProtectorGame.player = game.add.sprite(9*64, 5*64, 'player');

	//enable physics
	game.physics.arcade.enable(ProtectorGame.player);

	//USAGE : 				hitboxW, hitboxH, offsetX, offsetY
	ProtectorGame.player.body.setSize(50, 50, 10, 10);

	ProtectorGame.player.body.collideWorldBounds = true;
	
	//have the camera follow Zaun
	game.camera.follow(ProtectorGame.player);
	
	//add player animations
	ProtectorGame.player.animations.add('walking_up', [0, 1, 2], 15, true);
	ProtectorGame.player.animations.add('walking_down', [11, 12, 13, 14], 15, true);
	ProtectorGame.player.animations.add('walking_left', [3, 4, 5, 6], 15, true);
	ProtectorGame.player.animations.add('walking_right', [7, 8, 9, 10], 15, true);
	ProtectorGame.player.animations.add('idle_left', [3], 15, true);
	ProtectorGame.player.animations.add('idle_right', [7], 15, true);	
	ProtectorGame.player.animations.add('idle_down', [11], 15, true);
	ProtectorGame.player.animations.add('idle_up', [0], 15, true);

	//reset all values
	ProtectorGame.zaun.health = 100;
	ProtectorGame.zaun.energy = 100;
	ProtectorGame.zaun.collectedAntidotes = 0;
	ProtectorGame.zaun.goalAntidotes = -1;

	//start energy restore timer
	ProtectorGame.zaun.timerId = setInterval(function() {
		ProtectorGame.zaun.restoreEnergy();
	}, 3000);

	//reset local variables
	currentlyMoving = false;
	random = false;
	currentPath = [];
	savedPath = [];
	targetX = -1;
	targetY = -1;

	followingRoad = false;
	traveledRoads = [];
	roadReset = false;
	roadResetId = null;
	roadFollowEnable = true;
}
var tilesPlaced = [];

/*
	This function sets the goal number of antidotes for zaun to collect. This is set by map_controller when parsing the map asset data. When Zaun
	reaches his goal, the level is complete and a ui victory screen will appear

	PARAMS				: 		n - The number of antidotes for Zaun to collect

	POSTCONDITIONS		: 		> Zaun's goal number of antidotes is properly updated
*/
ProtectorGame.zaun.setGoal = function(n) {
	ProtectorGame.zaun.goalAntidotes = n;
}

/*
	This function is called when Zaun is hit, and will take 20 health away from the total health, as well as update the ui health
	bar accordingly

	PARAMS				: 		N/A

	POSTCONDITIONS		: 		> Zaun's health is properly updated.
*/
ProtectorGame.zaun.loseHealth = function(zaun, arrow) {
	if(ProtectorGame.zaun.health > 0 && ProtectorGame.zaun.invincible == false) ProtectorGame.zaun.health -=20;

	ProtectorGame.ui.updateHealthBar();

	//destroy arrow
	arrow.body = null;
	arrow.destroy();
}

/*
	This function is called whenever the user places an item on the map using an ability. 

	PARAMS				: 		N/A

	POSTCONDITIONS		: 		> Player's evergy is properly updates
*/
ProtectorGame.zaun.useEnergy = function() {
	if(ProtectorGame.zaun.energy > 0 && ProtectorGame.zaun.invincible == false) ProtectorGame.zaun.energy -= 20;
	ProtectorGame.ui.updateEnergyBar();

}

/*
	This function is called whenever the energy restore timer calls it 

	PARAMS				: 		N/A

	POSTCONDITIONS		: 		> Player's evergy is properly updates
*/
ProtectorGame.zaun.restoreEnergy = function() {
	console.log("<Zaun> RESTORING ENERGY ****");
	if(ProtectorGame.zaun.energy < 100) ProtectorGame.zaun.energy += 20;
	ProtectorGame.ui.updateEnergyBar();
}

/*
	This function is called when Zaun collects an antidote. When zaun collects all the antidotes in a level, a victory screen will be displayed

	PARAMS				: 		zaun - a reference to zaun
						        antidote - a reference to the antidote sprite that zaun collided with

	POSTCONDITIONS		: 		> Zaun's antidotes get increased by 1, and the sprite of the antidote collected is deleted from the map
*/
ProtectorGame.zaun.collectAntidote = function(zaun, antidote) {
	console.log("<Zaun> Collected antidote! " + (ProtectorGame.zaun.collectedAntidotes+1) + " collected in total.");
	ProtectorGame.zaun.collectedAntidotes++;
	antidote.destroy();
	if(ProtectorGame.zaun.collectedAntidotes == ProtectorGame.zaun.goalAntidotes) {
		console.log("<Zaun> Reached the goal! Level complete.");
		ProtectorGame.state = ProtectorGame.states.level_complete;
	}
}

/*
	This callback function gets called whenever Zaun collides with an enemy (specified by ProtectorGame.map_controller.enemies)

	PARAMS				: 		zaun - Reference to zaun (actually ProtectorGame.player)
								enemy - Reference to the enemy sprite that Zaun collided with

	POSTCONDITIONS		: 		> Zaun's new target is 3 tiles in the opposite direction of the enemy sprite
*/
ProtectorGame.zaun.collideEnemyCallback = function(zaun, enemy) {
	random = false;
	currentlyMoving = false;
	//moveZaun(targetTileX, targetTileY);
	moveZaunRandomly();
}


/*
	This callback function gets called whenever Zaun collides with an object in ProtectorGame.map_controller.rigid_bodies.

	PARAMS				: 		zaun - Reference to zaun (actually ProtectorGame.player)
								rigidBody - Reference to the rigid body object that Zaun collided with

	POSTCONDITIONS		: 		> Zaun's new target is 3 tiles in the opposite direction of the rigid body object
*/
ProtectorGame.zaun.collideRigidBodyCallback = function(zaun, rigidBody) {
	random = false;
	currentlyMoving = false;
	//moveZaun(targetTileX, targetTileY);
	moveZaunRandomly();
}

ProtectorGame.zaun.followRoad = function(zaun, road) {
		if(roadFollowEnable == false) {
			return;
		}

		followingRoad = true;
		roadReset = true;

		//follow the yellow brick road !!
		var playerX = parseInt(ProtectorGame.player.x);
		var playerY = parseInt(ProtectorGame.player.y);

		while(playerX%64 != 0) {
			playerX--;
		}
		while(playerY%64 != 0) {
			playerY--;
		}

		var currentTile = ProtectorGame.map_controller.map.getTileWorldXY(playerX, playerY, 64, 64, ProtectorGame.map_controller.backgroundLayer, false);
		if(currentTile == null) {
			console.log("unable to get tile from player location. . .");
			return;
		}

		//get all adjacent tiles
		var adjacentTiles = getAdjacentTiles(currentTile);

		for(var i=0; i < adjacentTiles.length; i++) {
			if(adjacentTiles[i] == null) continue;	//this tile was removed by the loop above
			for(var z=0; z < ProtectorGame.map_controller.roads.length; z++) {
				//console.log("roadX,Y=("+ProtectorGame.map_controller.roads.getAt(z).x/64 + " , "+ProtectorGame.map_controller.roads.getAt(z).y/64+")");
				//console.log("tileX,Y=("+adjacentTiles[i].x + " , " + adjacentTiles[i].y + ")");
				if(ProtectorGame.map_controller.roads.getAt(z).x/64 == adjacentTiles[i].x && ProtectorGame.map_controller.roads.getAt(z).y/64 == adjacentTiles[i].y) {
					
					var roadAlreadyTraveled = false;
					for(var j=0; j<traveledRoads.length; j++) {
						if(traveledRoads[j] == ProtectorGame.map_controller.roads.getAt(z)) {
							roadAlreadyTraveled = true;
							break;
						}
					}

					//don't consider this road if it was already traveled
					if(roadAlreadyTraveled == true) {
						console.log("***** SKIPPING TILE *****");
					} 
					else {
						//if this is a new road, then process and travel to it
						//console.log("***** adjacent road found!! *****");
						//console.log("playerX,Y=("+playerX/64+" , "+playerY/64+")");
						//console.log("roadX,Y=("+ProtectorGame.map_controller.roads.getAt(z).x/64 + " , "+ProtectorGame.map_controller.roads.getAt(z).y/64+")");
						//console.log("tileX,Y=("+adjacentTiles[i].x + " , " + adjacentTiles[i].y + ")");

						var newTargetX = ProtectorGame.map_controller.roads.getAt(z).x/64;
						var newTargetY = ProtectorGame.map_controller.roads.getAt(z).y/64;

						//make zaun go in the right direction
						if(newTargetX < playerX/64) ProtectorGame.player.body.velocity.x = -vel;
						else if(newTargetX > playerX/64) ProtectorGame.player.body.velocity.x = vel;
						else ProtectorGame.player.body.velocity.x = 0;

						if(newTargetY < playerY/64) ProtectorGame.player.body.velocity.y = -vel;
						else if(newTargetY > playerY/64) ProtectorGame.player.body.velocity.y = vel;
						else ProtectorGame.player.body.velocity.y = 0;

						//now make zaun play the right animation
						if(ProtectorGame.player.body.velocity.x > 0) {
							ProtectorGame.player.animations.play('walking_right');
						}
						else if(ProtectorGame.player.body.velocity.x < 0) {
							ProtectorGame.player.animations.play('walking_left');
						}
						else {
							if(ProtectorGame.player.body.velocity.y > 0) {
								ProtectorGame.player.animations.play('walking_down');
							}
							else if(ProtectorGame.player.body.velocity.y < 0) {
								ProtectorGame.player.animations.play('walking_up');
							}
						}	

						//finally, add this road to the already traveled list
						traveledRoads.push(ProtectorGame.map_controller.roads.getAt(z));

						//moveZaun(ProtectorGame.map_controller.roads.getAt(z).x, ProtectorGame.map_controller.roads.getAt(z).y);
						//movePlayer(newTargetX, newTargetY);
						return;
					}
				}
			}
		}
}

/*
	This function gets called when Zaun gets fuckin rekt by a mobile Hunter. These enemies can kill Zaun in one hit, so it's game
	over state if this function gets called

	PARAMS				: 		zaun - A reference to Zaun sprite
								mobileHunter - A reference to the mobile hunter that collided with

	POSTCONDITIONS		: 		> Zaun get absolutely decimated and it's game over.
*/
ProtectorGame.zaun.getRekt = function(zaun, mobileHunter) {
	if(ProtectorGame.zaun.health > 0 && ProtectorGame.zaun.invincible == false) ProtectorGame.zaun.health = 0;
	ProtectorGame.ui.updateHealthBar();
}

/*
	This function updates the character, Zaun. This will run the AI into the game.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> All AI loaded into the game.
*/
ProtectorGame.zaun.update = function(game) {
	//add collision for this player with the blocked layer
	game.physics.arcade.collide(ProtectorGame.player, ProtectorGame.map_controller.blockedLayer);

	//add collision for this player and all rigid objects
	game.physics.arcade.collide(ProtectorGame.player, ProtectorGame.map_controller.rigid_objects, ProtectorGame.zaun.collideRigidBodyCallback, null, this);

	//add collision for this player and all enemies
	game.physics.arcade.collide(ProtectorGame.player, ProtectorGame.map_controller.enemies, ProtectorGame.zaun.collideEnemyCallback, null, this);

	//collide zaun with all mobile hunters. if he gets hit by one of these guys, he dies
	game.physics.arcade.collide(ProtectorGame.player, ProtectorGame.hunter.mobileHuntersGroup, ProtectorGame.zaun.getRekt, null, this);

	//add overlap detection for hunter arrows. this will call the callback function loseHealth, passing the two overlapping
	//objects as parameters when an overlap occurs.
	var hit = game.physics.arcade.overlap(ProtectorGame.player, ProtectorGame.hunter.arrows, ProtectorGame.zaun.loseHealth, null, this);
	var collect = game.physics.arcade.overlap(ProtectorGame.player, ProtectorGame.map_controller.antidotes, ProtectorGame.zaun.collectAntidote, null, this);
	var onRoad = game.physics.arcade.overlap(ProtectorGame.player, ProtectorGame.map_controller.roads, ProtectorGame.zaun.followRoad, null, this);
	
	if(!onRoad) {
		followingRoad = false;
		if(roadReset == true) {
			roadFollowEnable = false;
			roadReset = false;

			console.log("***** not on road *****");
			roadResetId = setInterval(function() {
				console.log("<Zaun> resetting road travel memory");
				roadFollowEnable = true;
				traveledRoads = [];
				clearInterval(roadResetId);
				roadReset = false;
				//a bunch of shittily chained tween functions because i suck
				//Add a tween that basically fades the alpha of all roads in the roads phaser group to 0 over 2 seconds, linearly. Then use the onComplete
				//signal to add a callback that deletes all children in the group when the tween completes.
				ProtectorGame.game.add.tween(ProtectorGame.map_controller.roads).to({alpha: 0}, 2000, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(function() {
					ProtectorGame.map_controller.roads.removeAll();
					//ProtectorGame.map_controller.roads.destroy();
					//ProtectorGame.map_controller.roads = ProtectorGame.game.add.group();
					ProtectorGame.map_controller.roads.alpha = 1;
				}, this);
				
			}, 5000);
		}
	}

	if(currentPath.length > 0) currentlyMoving = true;
	else currentlyMoving = false;

	//handles moving Zaun when he interacts with objects.
	var userPlacedTiles = ProtectorGame.map_controller.loadedObjects;
	var lastPlacedTile = userPlacedTiles.pop();
	if(lastPlacedTile != null)
	{
		if(lastPlacedTile.key == "wall_item")
		{
			//also add hunter.hunters to blocked tiles
			addToBlockedTiles(lastPlacedTile);

			/*var randomX = Math.floor(Math.random()*(ProtectorGame.map_controller.width*64-1));
			var randomY = Math.floor(Math.random()*(ProtectorGame.map_controller.height*64-1));
			//wall placed, recalculate new tile.
			currentlyMoving = false;
			random = false;
			moveZaun(randomX, randomY);*/
		}
		else if(lastPlacedTile.key == "road_item") {
			//do nothing
		}
		else
		{
			if(pathFindEnable == true) {
				moveZaun(lastPlacedTile.x, lastPlacedTile.y);
			}
		}
		tilesPlaced.push(lastPlacedTile);
	}
	else if(followingRoad == false)
	{
		if(pathFindEnable == true) {
			moveZaunRandomly();
		}
	}
	
}

ProtectorGame.zaun.resetTiles = function() {
	ProtectorGame.map_controller.loadedObjects = tilesPlaced;
}

function moveZaun(x, y)
{
	//stop the player once it has reached the required coordinates
	var reachedX = false;
	var reachedY = false;

	//reset the current movement
	currentlyMoving = false;
	random = false;
	//check for non-random action
	if(!random && !currentlyMoving) {
		ProtectorGame.player.body.velocity.x = 0;
		ProtectorGame.player.body.velocity.y = 0;
		
		for(var i=savedPath.length-1; i >= 0; i--) {
			savedPath[i].alpha = 1;
		} 
		showPath = false;
		random = true;
		findPath(ProtectorGame.player.x, ProtectorGame.player.y, parseInt(x), parseInt(y));
	}
	
	//if player is set to move, then poll for directions
	if(currentlyMoving && currentPath.length != 0) {
		try {
			movePlayer(currentPath[currentPath.length - 1].worldX, currentPath[currentPath.length - 1].worldY);
		}
		catch(err) {
			console.log("RUNTIME ERROR : Unable to move Zaun !!!! -> " + err);
			//restart pathfind
			reachedX = true;
			reachedY = true;
		}
	}

	
	//if the character reaches the target point, stop
	if(ProtectorGame.player.x > targetX - MAX_ERROR && ProtectorGame.player.x < targetX + MAX_ERROR) {
		ProtectorGame.player.body.velocity.x = 0;
		reachedX = true;
	}
	if(ProtectorGame.player.y > targetY - MAX_ERROR && ProtectorGame.player.y < targetY + MAX_ERROR) {
		ProtectorGame.player.body.velocity.y = 0;
		reachedY = true;
	}

	if(reachedX && reachedY) {
		ProtectorGame.player.animations.stop();
		currentlyMoving = false;
		random = false;
	}

	//player idle animation if player not moving
	if(!currentlyMoving) {
		if(dir == "up") ProtectorGame.player.animations.play('idle_up');
		else if(dir == "down") ProtectorGame.player.animations.play('idle_down');
		else if(dir == "left") ProtectorGame.player.animations.play('idle_left');
		else if(dir == "right") ProtectorGame.player.animations.play('idle_right');
	}
}

function moveZaunRandomly()
{
	//stop the player once it has reached the required coordinates
	var reachedX = false;
	var reachedY = false;

	//check for non-random action
	if(!random && !currentlyMoving) {
		ProtectorGame.player.body.velocity.x = 0;
		ProtectorGame.player.body.velocity.y = 0;
		for(var i=0; i < 1; i++) {
			var randomX = Math.floor(Math.random()*(ProtectorGame.map_controller.width*64-1));
			var randomY = Math.floor(Math.random()*(ProtectorGame.map_controller.height*64-1));
			console.log("X: " + randomX + " Y: " + randomY);

			//dont leave here until a valid random tile has been found.
			if(ProtectorGame.map_controller.map.getTileWorldXY(randomX, randomY, 64, 64, ProtectorGame.map_controller.backgroundLayer, true) == null) {
				i--;
			}
		}
		
		for(var i=savedPath.length-1; i >= 0; i--) {
			savedPath[i].alpha = 1;
		} 
		showPath = false;
		random = true;
		findPath(ProtectorGame.player.x, ProtectorGame.player.y, parseInt(randomX), parseInt(randomY));
	}
	
	//if player is set to move, then poll for directions
	if(currentlyMoving && currentPath.length != 0) {
		try {
			movePlayer(currentPath[currentPath.length - 1].worldX, currentPath[currentPath.length - 1].worldY);
		}
		catch(err) {
			console.log("RUNTIME ERROR : Unable to move Zaun !!!! -> " + err);
			//restart pathfind
			reachedX = true;
			reachedY = true;
		}
		
	}

	//if the character reaches the target point, stop
	if(ProtectorGame.player.x > targetX - MAX_ERROR && ProtectorGame.player.x < targetX + MAX_ERROR) {
		ProtectorGame.player.body.velocity.x = 0;
		reachedX = true;
	}
	if(ProtectorGame.player.y > targetY - MAX_ERROR && ProtectorGame.player.y < targetY + MAX_ERROR) {
		ProtectorGame.player.body.velocity.y = 0;
		reachedY = true;
	}

	if(reachedX && reachedY) {
		ProtectorGame.player.animations.stop();
		currentlyMoving = false;
		random = false;
	}

	//player idle animation if player not moving
	if(!currentlyMoving) {
		if(dir == "up") ProtectorGame.player.animations.play('idle_up');
		else if(dir == "down") ProtectorGame.player.animations.play('idle_down');
		else if(dir == "left") ProtectorGame.player.animations.play('idle_left');
		else if(dir == "right") ProtectorGame.player.animations.play('idle_right');
	}
}


//implements the A* pathfinding algorithm to create a path from the current player location to the location
//of the mouse click
function findPath(initX, initY, finalX, finalY)
{
	//set of nodes done being considered
	var closedSet = [];

	//list of currently discovered nodes (current node + neighbors) waiting to be evaluated. First tile
	//to add to open set is the start tile
	var startTile = {
		tile: ProtectorGame.map_controller.map.getTileWorldXY(initX, initY),
		parent: null
	};
	var openSet = [startTile];

	//the parent of each node at the given index in the closedLiset.
	//USAGE : parents[i] will give the parent node of the node stored in closedList[i]
	var parents = [];

	//this variable will contain the currently selected tile, meaning the current furthest known tile in the 
	//path
	var selected;

	//tells if the algorithm found the desired tile (handles events where tile is in blockedLayer or impossible to get to)
	var found = false;

	//this variable will contain
	var selectedTile = {};

	//correct target values to nearest tile
	while(finalX%64 != 0) {
		finalX--;
	}
	while(finalY%64 != 0) {
		finalY--;
	}
	//console.log(ProtectorGame.map_controller.map.getTileWorldXY(finalX, finalY, 64, 64, ProtectorGame.map_controller.backgroundLayer, true));
	
	targetTileX = finalX;
	targetTileY = finalY;

	if(ProtectorGame.map_controller.map.getTileWorldXY(finalX, finalY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null) {
		console.log("canceling path find. . .");
		random = false;
		currentlyMoving = false;
		return;
	}

	console.log("TARGET - X : " + finalX + " , Y : " + finalY);
	while(openSet.length != 0) {
	//for(var z=0; z < 50; z++) {
		//if were at the target, done with the loop
		if(selected != null && selected.worldX == finalX && selected.worldY == finalY) {
			//console.log("ALGO FOUND TARGET!!");
			found = true;
			break;
		}

		if(selected != null) {
			//console.log("selected - X : " + selected.worldX + " , Y : " + selected.worldY);
		}

		//get fScores every loop iteration
		var fScores = [];

		//compute the f scores of all the tiles in the open set
		fScores = getFScores(openSet, selected, finalX, finalY);
		//console.log(fScores);

		//loop through fScores and find the index of lowest score
		var lowestScore = fScores[0];
		var lowestIndex = 0;

		for(var i=0; i < fScores.length; i++) {
			//if lower score, change lowest score variable
			if(fScores[i] < lowestScore) {
				lowestScore = fScores[i];
				lowestIndex = i;
			}
		}

		//push the tile with the lowest score to the closed set, and remove it from the open set
		closedSet.push(selectedTile)
		selected = openSet[lowestIndex].tile;	//also set the selected tile to this one

		//This is a wrapper object that is used to store the tile data in the arrays. Each Tile object will have two fields: a reference
		//to the node represented by this tile, Tile.tile, and a reference to the node's parent, Tile.parent.
		selectedTile = {
			tile: openSet[lowestIndex].tile,
			parent: openSet[lowestIndex].parent
		};
		openSet.splice(lowestIndex, 1);	//remove the selected tile from open set, since it's now in the closed set

		//console.log("CLOSED SET : " + closedSet);
		//console.log("OPEN SET : " + openSet);

		//get an array of all the walkable adjacent tiles to consider, using a helper method
		var adjacentTiles = [];
		adjacentTiles = getAdjacentTiles(selected);
		if(adjacentTiles == null) {
			found = false;
			break;
		}

		//now for all adjacent tiles NOT already in the openSet, add to openSet
		for(var i=0; i < adjacentTiles.length; i++) {
			//don't consider this node if it has already been considered
			if(arrayContains(adjacentTiles[i], closedSet)) {
				continue;
			}

			//check to see if this node is in the open set. If not, add it. else, check if it is a better path
			if(!arrayContains(adjacentTiles[i], openSet)) {
				//create the new tile wrapper object
				var newTile = {
					tile: adjacentTiles[i],
					parent: selectedTile
				};
				openSet.push(newTile);
				//openSet.push(adjacentTiles[i]);
			}
		}
	}

	//if the tile was not found then that means it was either invalid (not in the ProtectorGame.map_controller.map) or unreachable. don't trigger movement and return.
	if(!found) {
		console.log("err: unable to find the target");
		random = false;
		currentlyMoving = false;
		return;
	}

	//now reconstruct the path by backtracking from the target location, through the parents, back to the start
	var path = [];	//the array to hold the final path
	var atTile = closedSet[closedSet.length - 1];	//this holds the next tile to add to the path

	while(atTile != null) {
	//for(vari=0; i < 20; i++) {
		path.push(atTile.tile);
		atTile = atTile.parent;
	}
	console.log(path);
	// when they backtrace, it looks like it's only the last tile we need to remove, so let's try popping it.
	if(path.length > 1) //path must be greater than 1
		path.pop();
	//set the vals required to start movement
	currentlyMoving = true;
	currentPath = path;
	savedPath =  [];
	for(var i=0; i < path.length; i++) {
		savedPath.push(path[i]);
	}
}

//had to make my own helper method to check for element in array because jQuery doesn't f$%&ing work. . .
//PARAMS : element - element in the array to check, must be of same type
//		   arr     - array to search
function arrayContains(element, arr)
{
	for(var i=0; i < arr.length; i++) {
		if(arr[i].tile == element) return true;
	}
	return false;
}

//quick helper method that will get the gScore of one tile, given the current tile considered and the target
//tile which MUST be adjacent to currentTile.
function gscore(currentTile, targetTile)
{
	if(currentTile.worldX == targetTile.worldX || currentTile.worldY == targetTile.worldY) return 10;	//adj
			else return 14;	//diagonal tile
}


function addToBlockedTiles(sprite)
{
	var tile = ProtectorGame.map_controller.map.getTileWorldXY(sprite.x, sprite.y);
	playerBlockedTiles.push(tile);
}

function isBlocked(tileA)
{
	if(playerBlockedTiles == null && playerBlockedTiles.length == 0)
		return false;
	for(var a = 0; a < playerBlockedTiles.length; a++)
	{
		//compare X and Y of tiles
		if(playerBlockedTiles[a].x == tileA.x && playerBlockedTiles[a].y == tileA.y)
			return true;
		
			
	}
	return false;
}

function fixPathfinding(tileList)
{
	for(var i = 0; i < tileList.length-1; i++)
		tileList[i] = tileList[i+1]
}

//This helper method will return an array containing all the walkable adjacent tiles of the tile given
//in the parameter. A tile is walkable as long as it is not in the blockedLayer of the tile ProtectorGame.map_controller.map, a.k.a. it
//is a wall or some other form of immovable object
function getAdjacentTiles(tile)
{
	//tmp tile to hold value to consider
	var tmpTile;
	//array of adjacent tiles to return at the end of the function
	var adjTiles = [];

	//** NOTE : tile.x IS THE VIEWPORT-RELATIVE X VALUE, tile.worldX IS THE WORLD ProtectorGame.map_controller.map X VALUE **//
	try {
		//get tile above
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX, tile.worldY - 64);
		//let's see if I can break this down...
		//if the temp tile is not undefined, and the tile isn't in the blocked layer, then push the tile.
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX, tile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		//if the temp tile is not undefined, check the gscores, check if the adj tiles aren't null, otherwise, pop.
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14 && (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
		//get tile right
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX + 64, tile.worldY);
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX + 64, tile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14 && (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
		//get tile below
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX, tile.worldY + 64);
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX, tile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14&& (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
		//get tile left
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX - 64, tile.worldY);
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX - 64, tile.worldY,64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14 && (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
		//get tile topLeft
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX - 64, tile.worldY - 64);
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX - 64, tile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14 && (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
		//get tile topRight
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX + 64, tile.worldY - 64);
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX + 64, tile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14 && (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
		//get tile bottomRight
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX + 64, tile.worldY + 64);
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX + 64, tile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14 && (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
		//get tile bottomLeft
		tmpTile = ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX - 64, tile.worldY + 64);
		if(tmpTile != undefined && ProtectorGame.map_controller.map.getTileWorldXY(tile.worldX - 64, tile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && gscore(tile, tmpTile) == 14 && (ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null
										|| ProtectorGame.map_controller.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, ProtectorGame.map_controller.blockedLayer, true) != null)) adjTiles.pop();
		if(tmpTile != null && isBlocked(tmpTile))
			adjTiles.pop();
	}
	catch(err) {
		console.log("<Zaun> ERROR GETTING ADJACENT TILES !! -> " + err);
		/*if(ProtectorGame.player.body.velocity.y < 0) {
			ProtectorGame.player.y++;
		}
		else if(ProtectorGame.player.body.velocity.y > 0) {
			ProtectorGame.player.y--;
		}

		if(ProtectorGame.player.body.velocity.x < 0) {
			ProtectorGame.player.x++;
		}
		else if(ProtectorGame.player.body.velocity.x > 0) {
			ProtectorGame.player.x--;
		}*/
		ProtectorGame.player.body.velocity.x = -ProtectorGame.player.body.velocity.x;
		ProtectorGame.player.body.velocity.y = -ProtectorGame.player.body.velocity.y;

		pathFindEnable = false;
		var id = setInterval(function() {
			pathFindEnable = true;
		}, 1000);

		return null;
	}
	
	//finally, return the array of valid tiles
	return adjTiles;
}

//This method will compute the F score (G + H) of all the tiles in the parameter array, arr. It also takes 
//the x&y coords of the target tile as parameter to calculate hScore, as well as a reference to the currently
//selected tile. 
function getFScores(arr, currentTile, targetX, targetY) 
{
	//if theres only one element to consider, no need to calculate since it will definitely be added to the 
	//closedSet regardless of fScore, since it is the only possible node to travel to
	if(arr.length == 1) return [10];

	//variables for our g and h scores
	var gScore = -1;	//cost of going from current tile to next (10 if adjacent, 14 if diagonal)
	var hScore = -1;	//distance from the target disregarding walls, using the manhattan method (no diagonal moves)

	//this array holds the fScores of the tile at the same index as in the array arr. This variable will be
	//returned upon completion
	var fScores = [];

	//loop through all tiles in the array
	for(var i=0; i < arr.length; i++) {
		//the fScore, which is equal to gSCore + hScore, and will be pushed to the array at the end of this
		//loop iteration
		var fScore;

		//variables for our g and h scores
		var gScore = -1;	//cost of going from current tile to next (10 if adjacent, 14 if diagonal)
		var hScore = -1;	//distance from the target disregarding walls, using the manhattan method (no diagonal moves)

		//determine gScore of current tile in arr
		if(currentTile.worldX == arr[i].tile.worldX || currentTile.worldY == arr[i].tile.worldY) gScore = 10;	//adjacent tile
		else gScore = 14;	//diagonal tile

		//determine hScore of current tile in arr, which is difference in x + difference in y, relative to
		//tiles. Tile size is 64x64, so to get number of tiles simply divide by 64
		hScore = 10 * parseInt((Math.abs(targetX - arr[i].tile.worldX))/64 + (Math.abs(targetY - arr[i].tile.worldY))/64); 

		//finally, compute the fScore and push it to the array.
		fScore = gScore + hScore;
		fScores.push(fScore)
	}
	return fScores;
}

//moves the player to the tile specified by the coordinates in the params
function movePlayer(xCoord, yCoord) 
{
	var xMove = false;
	var set = false;

	var up = 0;
	var down = 0;
	var left = 0;
	var right = 0;
	//set the target point
	targetX = xCoord;
	targetY = yCoord;

	//game.add.tween(player).to({x: parseInt(xCoord), y: parseInt(yCoord), 250, Phaser.Easing.Quadratic,InOut, true});
	//console.log("FROM : " + parseInt(player.x) + "," + parseInt(player.y) + " TO : " + parseInt(xCoord) + "," + parseInt(yCoord));
	if(ProtectorGame.player.x > xCoord - MAX_ERROR && ProtectorGame.player.x < xCoord + MAX_ERROR && ProtectorGame.player.y > yCoord - MAX_ERROR && ProtectorGame.player.y < yCoord + MAX_ERROR) {
		currentPath.pop();
		ProtectorGame.player.body.velocity.x = 0;
		ProtectorGame.player.body.velocity.y = 0;
		currentlyMoving = false;
		return;
	}

	//the player will need to travel in the +x direction (right)
	if(ProtectorGame.player.x < xCoord-MAX_ERROR) {
		ProtectorGame.player.animations.play('walking_right');
		dir = "right";
		xMove = true;
		set = true;
		right = 1;
	}
	//the player will neeed to travel in the -x direction (left)
	if(ProtectorGame.player.x > xCoord+MAX_ERROR) {
		ProtectorGame.player.animations.play('walking_left');
		dir = "left";
		xMove = true;
		set = true;

		left = 1;
	}
	//the player will need to travel in the -y direction (up)
	if(ProtectorGame.player.y > yCoord+MAX_ERROR) {
		if(!xMove) ProtectorGame.player.animations.play('walking_up');
		dir = "up";
		set = true;
		up = 1;
	}
	//the player will need to travel in the +y direction (down)
	if(ProtectorGame.player.y < yCoord-MAX_ERROR) {
		if(!xMove) ProtectorGame.player.animations.play('walking_down');
		dir = "down";
		set = true;
		down = 1;
	}

	//move to the tile
	moveTile(up, down, left, right);
	//player.body.position.y = parseInt(yCoord);
	//player.body.position.x = parseInt(xCoord);
	if(!set) {
		ProtectorGame.player.animations.stop();
		currentlyMoving = false;
	}
}

//helper function, moves the player up one tile in the specified direction, given by integer params
//USAGE : to move, say, up&right, use moveTile(1, 0, 0, 1);
function moveTile(up, down, left, right)
{
	if(up > 0) ProtectorGame.player.body.velocity.y = -vel;
	if(down > 0) ProtectorGame.player.body.velocity.y = vel;

	if(left > 0) ProtectorGame.player.body.velocity.x = -vel;
	if(right > 0) ProtectorGame.player.body.velocity.x = vel;
}

