///////////////////////////////////////////////////////////////////////////////////////////////////
// map_controller.js - CSE 380 Final Project												 	 //
//																								 //
// This source file controls the tilemaps for each level. It will handle map loading for each	 //
// level, and also will provide helper functions to allow the ui to interface with the map.      //
//																							     //
// (c) 2017 Team Protector																		 //
//																								 //
// Authors: Daniel Gomm, Noam Dorogoyer, Tristen Terracciano									 //
//																								 //
///////////////////////////////////////////////////////////////////////////////////////////////////

//Ensure global game object is defined
var ProtectorGame = ProtectorGame || {};

//define the map controller object within the global game object
ProtectorGame.map_controller = {};

//variable containing the currently loaded map, null if there is no map loaded
ProtectorGame.map_controller.map;

//contains the width and height of the map
ProtectorGame.map_controller.width = 99;
ProtectorGame.map_controller.height = 99;

//define map layers
ProtectorGame.map_controller.backgroundLayer;
ProtectorGame.map_controller.blockedLayer;
ProtectorGame.map_controller.itemLayer;
ProtectorGame.map_controller.hunterLayer;
ProtectorGame.map_controller.objectLayer;
ProtectorGame.map_controller.xLayer;

//list of currently available level maps
ProtectorGame.map_controller.maps = [];

//holds the the index of the most recently loaded map (i.e. level1 map is index 0)
ProtectorGame.map_controller.lastMapIndex = -1;

//array that holds all objects placed in the map, this is used to know what objects need to be deleted in close_map
ProtectorGame.map_controller.loadedObjects = [];

//define collision groups. these are used to make sure zaun can't travel through certain items (i.e. wall) and enemies
ProtectorGame.map_controller.rigid_objects;
ProtectorGame.map_controller.enemies;
ProtectorGame.map_controller.antidotes;
ProtectorGame.map_controller.roads;

//holds the last beacon placed so it can be deleted when a new one is placed
ProtectorGame.map_controller.lastBeacon;

//define the cursor_highlighter object. this service has been placed in an object for simplicity
ProtectorGame.map_controller.cursor_highlighter = {};
ProtectorGame.map_controller.cursor_highlighter.toggled = false;
ProtectorGame.map_controller.cursor_highlighter.selectedTile;
ProtectorGame.map_controller.cursor_highlighter.blockedTile;
ProtectorGame.map_controller.cursor_highlighter.toggle = function() {
	if(this.toggled == false) this.toggled = true;
	else this.toggled = false;
}
ProtectorGame.map_controller.cursor_highlighter.update = function(game) {
	//highlight the tile that the mouse is currently over
	var mouseX = parseInt(game.input.activePointer.position.x + game.camera.x);
	var mouseY = parseInt(game.input.activePointer.position.y + game.camera.y);

	//adjust coords to be an actual tile map coord
	while(mouseX%64 != 0) {
		mouseX--;
	}
	while(mouseY%64 != 0) {
		mouseY--;
	}

	var zaunX = parseInt(ProtectorGame.player.position.x);
	var zaunY = parseInt(ProtectorGame.player.position.y);

	while(zaunX%64 != 0) {
		zaunX--;
	}
	while(zaunY%64 != 0) {
		zaunY--;
	}

	//if the mouse is clicked, toggle the cursor highlighter and return
	if(game.input.activePointer.isDown == true) {
		//only add tile if its not in the blocked layer
		if(ProtectorGame.map_controller.map.getTileWorldXY(mouseX, mouseY, 64, 64, ProtectorGame.map_controller.blockedLayer, false) == null) {
			//don't allow items to be placed on Zaun
			if(mouseX == zaunX && mouseY == zaunY) {
				return;
			}

			//only reset the map if the click happens on a tile. ignore click if over a ui element
			if(! ProtectorGame.ui.pointerOverUIOverlay(game) && ProtectorGame.map_controller.cursor_highlighter.selectedTile != null) {
				ProtectorGame.map_controller.backgroundLayer.dirty = true;
				ProtectorGame.map_controller.cursor_highlighter.selectedTile.alpha = 1;
			}
			ProtectorGame.map_controller.cursor_highlighter.toggled = false;
			ProtectorGame.ui.selectedItem.use(game);
			return;
		}
	}	

	//unhighlight the old selectedTile
	if(ProtectorGame.map_controller.cursor_highlighter.selectedTile != null) {
		ProtectorGame.map_controller.backgroundLayer.dirty = true;
		ProtectorGame.map_controller.cursor_highlighter.selectedTile.alpha = 1;
	}

	//unhighlight blocked tile
	if(ProtectorGame.map_controller.cursor_highlighter.blockedTile != null) {
		ProtectorGame.map_controller.blockedLayer.dirty = true;
		ProtectorGame.map_controller.cursor_highlighter.blockedTile.alpha = 1;
	}

	//now get the tile at the desired coordinates and highlight it
	ProtectorGame.map_controller.cursor_highlighter.selectedTile = ProtectorGame.map_controller.map.getTileWorldXY(mouseX, mouseY, 64, 64, ProtectorGame.map_controller.backgroundLayer, false);

	if(ProtectorGame.map_controller.cursor_highlighter.selectedTile != null) {
		ProtectorGame.map_controller.backgroundLayer.dirty = true;
		ProtectorGame.map_controller.cursor_highlighter.selectedTile.alpha = 0.5;
	}
	else {
		ProtectorGame.map_controller.cursor_highlighter.blockedTile = ProtectorGame.map_controller.map.getTileWorldXY(mouseX, mouseY, 64, 64, ProtectorGame.map_controller.blockedLayer, false);
		if(ProtectorGame.map_controller.cursor_highlighter.blockedTile != null) {
			ProtectorGame.map_controller.blockedLayer.dirty = true;
			ProtectorGame.map_controller.cursor_highlighter.blockedTile.alpha = 0.5;
		}
	}
}

/*
	This function initializes the map controller. This will load in all tilesets and tilemaps into the game

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> All tilesets and tilemaps are loaded into the Phaser game. 
*/
ProtectorGame.map_controller.initialize = function(game) {
	console.log("<map_controller> initializing. . .");
	//load in tilemap data via JSON files
	var lv1 = game.load.tilemap('level1', 'assets/maps/level1.json', null, Phaser.Tilemap.TILED_JSON);
	var lv2 = game.load.tilemap('level2', 'assets/maps/level2.json', null, Phaser.Tilemap.TILED_JSON);
	var lv3 = game.load.tilemap('level3', 'assets/maps/level3.json', null, Phaser.Tilemap.TILED_JSON);

	//load in the tilesets necessary for each level map.
	game.load.image('protectorTiles3', 'assets/tilesets/tileset3.png');
	game.load.image('protectorTiles', 'assets/tilesets/ProtectorTileset.png');
	game.load.image('protectorTiles_X', 'assets/tilesets/ProtectorTileset_X.png');
	game.load.image('protectorTiles_NEW', 'assets/tilesets/ProtectorTileset_NEW.png')

	//load in map object sprites
	game.load.image('antidote_green', 'assets/64px/greenAntidote64.png');

	//place references to each map in the maps array
	ProtectorGame.map_controller.maps = [lv1, lv2, lv3];

	//initialize all render layer groups
	ProtectorGame.map_controller.rigid_objects = game.add.group();
	ProtectorGame.map_controller.enemies = game.add.group();
	ProtectorGame.map_controller.antidotes = game.add.group();
	ProtectorGame.map_controller.roads = game.add.group();

	console.log("<map_controller> done.");
}

/*
	This function loads a tilemap into the game. The map to load is specified by the parameter selectedMap

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.
								selectedMap - an integer with the index of the level map to be loaded

	POSTCONDITIONS		: 		> The desired level map is loaded into the game and being displayed on the canvas
*/
ProtectorGame.map_controller.load_map = function(game, selectedMap) {
	ProtectorGame.map_controller.lastMapIndex = selectedMap;
	//level 1 is selected
	if(selectedMap == 0) {
		//set map bounds
		ProtectorGame.map_controller.width = 49;
		ProtectorGame.map_controller.height = 49;

		//load in desired level map
		ProtectorGame.map_controller.map = ProtectorGame.map_controller.maps[selectedMap];

		//load in tilemap
		ProtectorGame.map_controller.map = game.add.tilemap('level1');

		//load in the required tilesets
		ProtectorGame.map_controller.map.addTilesetImage('ProtectorTileset_X', 'protectorTiles_X');

		//load in the map layers
		ProtectorGame.map_controller.xLayer = ProtectorGame.map_controller.map.createLayer('xLayer');
		ProtectorGame.map_controller.backgroundLayer = ProtectorGame.map_controller.map.createLayer('backgroundLayer');
		ProtectorGame.map_controller.blockedLayer = ProtectorGame.map_controller.map.createLayer('blockedLayer');
		ProtectorGame.map_controller.itemLayer = ProtectorGame.map_controller.map.createLayer('itemLayer');
		//ProtectorGame.map_controller.hunterLayer = ProtectorGame.map_controller.map.createLayer('hunterLayer');

		//create and load zaun onto the field
		ProtectorGame.zaun.create(ProtectorGame.game);
		
		//finalize map
		//collision on blockedLayer
		//USAGE : 				     i0, i1, layer_key
		//range i0 - i1 specify the range for which we want to enable collision
		ProtectorGame.map_controller.map.setCollisionBetween(1, 600, true, 'blockedLayer');

		//resizes the game world to match the alyer dimensions
		ProtectorGame.map_controller.backgroundLayer.resizeWorld();

		//create antidotes group
		ProtectorGame.map_controller.antidotes = game.add.group();
		ProtectorGame.map_controller.antidotes.enableBody = true;

		//now, load in all hunters based on the corresponding .json file
		$(document).ready(function() {
			$.getJSON("assets/hunter_anti_ballista_map.json", function(data) {
				console.log("<map_controller> spawning hunters from JSON data file. . . " + data.hunters.length);

				for(var i=0; i < data.hunters.length; i++) {
					ProtectorGame.hunter.createMobile(game, data.hunters[i].x, data.hunters[i].y);
				}

				for(var i=0; i < data.ballistas.length; i++) {
					ProtectorGame.hunter.create(game, data.ballistas[i].x, data.ballistas[i].y);
				}

				console.log("<map_controller> done.");

				console.log("<map_controller> spawning antidotes from JSON data file. . ." + data.antidotes.length);
				ProtectorGame.zaun.setGoal(data.antidotes.length);	//set zaun's goal based on map asset data

				for(var i=0; i < data.antidotes.length; i++) {
					var tmp = game.add.sprite(64*data.antidotes[i].x, 64*data.antidotes[i].y, 'antidote_green');
					ProtectorGame.map_controller.loadedObjects.push(tmp);	//put in loadedObjects so it gets deleted on close map
					ProtectorGame.map_controller.antidotes.add(tmp);	//put in phaser group so collision can be detected
				}

				console.log("<map_controller> done.");
			});
		});
	}
	//level 2 is selected
	else if(selectedMap == 1) {
		//set map bounds
		ProtectorGame.map_controller.width = 39;
		ProtectorGame.map_controller.height = 29;

		//load in desired level map
		ProtectorGame.map_controller.map = ProtectorGame.map_controller.maps[selectedMap];

		//load in tilemap
		ProtectorGame.map_controller.map = game.add.tilemap('level2');

		//load in the required tilesets
		ProtectorGame.map_controller.map.addTilesetImage('ProtectorTileset_X', 'protectorTiles_X');

		//load in the map layers
		ProtectorGame.map_controller.xLayer = ProtectorGame.map_controller.map.createLayer('xLayer');
		ProtectorGame.map_controller.backgroundLayer = ProtectorGame.map_controller.map.createLayer('backgroundLayer');
		ProtectorGame.map_controller.blockedLayer = ProtectorGame.map_controller.map.createLayer('blockedLayer');
		ProtectorGame.map_controller.itemLayer = ProtectorGame.map_controller.map.createLayer('itemLayer');

		//create and load zaun onto the field
		ProtectorGame.zaun.create(ProtectorGame.game);
		
		//finalize map
		//collision on blockedLayer
		//USAGE : 				     i0, i1, layer_key
		//range i0 - i1 specify the range for which we want to enable collision
		ProtectorGame.map_controller.map.setCollisionBetween(1, 600, true, 'blockedLayer');

		//resizes the game world to match the layer dimensions
		ProtectorGame.map_controller.backgroundLayer.resizeWorld();

		//create antidotes group
		ProtectorGame.map_controller.antidotes = game.add.group();
		ProtectorGame.map_controller.antidotes.enableBody = true;

		//now, load in all hunters based on the corresponding .json file
		$(document).ready(function() {
			//$.getJSON("assets/lv2_hunter_map.json", function(data) {
			$.getJSON("assets/hunter_anti_ballista_map2.json", function(data) {
				console.log("<map_controller> spawning hunters from JSON data file. . . " + data.hunters.length);

				for(var i=0; i < data.hunters.length; i++) {
					ProtectorGame.hunter.createMobile(game, data.hunters[i].x, data.hunters[i].y);
				}

				for(var i=0; i < data.ballistas.length; i++) {
					ProtectorGame.hunter.create(game, data.ballistas[i].x, data.ballistas[i].y);
				}

				console.log("<map_controller> done.");

				console.log("<map_controller> spawning antidotes from JSON data file. . ." + data.antidotes.length);
				ProtectorGame.zaun.setGoal(data.antidotes.length);	//set zaun's goal based on map asset data
				
				for(var i=0; i < data.antidotes.length; i++) {
					var tmp = game.add.sprite(64*data.antidotes[i].x, 64*data.antidotes[i].y, 'antidote_green');
					ProtectorGame.map_controller.loadedObjects.push(tmp);	//put in loadedObjects so it gets deleted on close map
					ProtectorGame.map_controller.antidotes.add(tmp);	//put in phaser group so collision can be detected
				}

				console.log("<map_controller> done.");
			});
		});
	}

	//level 3 is selected
	else if(selectedMap == 2) {
		//set map bounds
		ProtectorGame.map_controller.width = 29;
		ProtectorGame.map_controller.height = 29;

		//load in desired level map
		ProtectorGame.map_controller.map = ProtectorGame.map_controller.maps[selectedMap];

		//load in tilemap
		ProtectorGame.map_controller.map = game.add.tilemap('level3');

		//load in the required tilesets
		ProtectorGame.map_controller.map.addTilesetImage('ProtectorTileset_NEW', 'protectorTiles_NEW');

		//load in the map layers
		ProtectorGame.map_controller.xLayer = ProtectorGame.map_controller.map.createLayer('xLayer');
		ProtectorGame.map_controller.backgroundLayer = ProtectorGame.map_controller.map.createLayer('backgroundLayer');
		ProtectorGame.map_controller.blockedLayer = ProtectorGame.map_controller.map.createLayer('blockedLayer');
		ProtectorGame.map_controller.itemLayer = ProtectorGame.map_controller.map.createLayer('itemLayer');

		//create and load zaun onto the field
		ProtectorGame.zaun.create(ProtectorGame.game);
		
		//finalize map
		//collision on blockedLayer
		//USAGE : 				     i0, i1, layer_key
		//range i0 - i1 specify the range for which we want to enable collision
		ProtectorGame.map_controller.map.setCollisionBetween(1, 600, true, 'blockedLayer');

		//resizes the game world to match the layer dimensions
		ProtectorGame.map_controller.backgroundLayer.resizeWorld();

		//create antidotes group
		ProtectorGame.map_controller.antidotes = game.add.group();
		ProtectorGame.map_controller.antidotes.enableBody = true;

		//now, load in all hunters based on the corresponding .json file
		$(document).ready(function() {
			$.getJSON("assets/hunter_anti_ballista_map3.json", function(data) {
				console.log("<map_controller> spawning hunters from JSON data file. . . " + data.hunters.length);

				for(var i=0; i < data.hunters.length; i++) {
					ProtectorGame.hunter.createMobile(game, data.hunters[i].x, data.hunters[i].y);
				}

				for(var i=0; i < data.ballistas.length; i++) {
					ProtectorGame.hunter.create(game, data.ballistas[i].x, data.ballistas[i].y);
				}
				console.log("<map_controller> done.");

				console.log("<map_controller> spawning antidotes from JSON data file. . ." + data.antidotes.length);
				ProtectorGame.zaun.setGoal(data.antidotes.length);	//set zaun's goal based on map asset data

				for(var i=0; i < data.antidotes.length; i++) {
					var tmp = game.add.sprite(64*data.antidotes[i].x, 64*data.antidotes[i].y, 'antidote_green');
					ProtectorGame.map_controller.loadedObjects.push(tmp);	//put in loadedObjects so it gets deleted on close map
					ProtectorGame.map_controller.antidotes.add(tmp);	//put in phaser group so collision can be detected
				}


				console.log("<map_controller> done.");
			});
		});
	}

	//make sure object and enemy layers render above all other layers. do this by adding these groups last
	ProtectorGame.map_controller.rigid_objects = game.add.group();
	ProtectorGame.map_controller.rigid_objects.enableBody = true;
	ProtectorGame.map_controller.enemies = game.add.group();
	ProtectorGame.map_controller.enemies.enableBody = true;
	ProtectorGame.map_controller.roads = game.add.group();
	ProtectorGame.map_controller.roads.enableBody = true;
	ProtectorGame.hunter.arrows = game.add.group();
	ProtectorGame.hunter.arrows.enableBody = true;
	ProtectorGame.hunter.mobileHuntersGroup = game.add.group();
	ProtectorGame.hunter.mobileHuntersGroup.enableBody = true;
}

//find objects in a Tiled layer that contains a property called "type" equal to a certain value
ProtectorGame.map_controller.findObjectsByType = function(type, map, layer) {
	var result = new Array();
	//Phaser uses top left, Tile bottom left so we have to adjust the y position
	map.objects[layer].forEach(function(element) {
		element.y -= map.tileHeight;
		result.push(element);
	});
	return result;
}

/*
	This function closes the currently loaded tilemap. This is used to clear the screen if the user ends the game or
	returns to the main menu.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> The tilemap is removed from the game and the background is cleared
*/
ProtectorGame.map_controller.close_map = function(game) {
	if(ProtectorGame.map_controller.xLayer != null) {
		ProtectorGame.map_controller.xLayer.destroy();
	}
	if(ProtectorGame.map_controller.backgroundLayer != null) {
		ProtectorGame.map_controller.backgroundLayer.destroy();
	}
	if(ProtectorGame.map_controller.blockedLayer != null) {
		ProtectorGame.map_controller.blockedLayer.destroy();
	}
	if(ProtectorGame.map_controller.itemLayer != null) {
		ProtectorGame.map_controller.itemLayer.destroy();
	}
	if(ProtectorGame.map_controller.hunterLayer != null) {
		ProtectorGame.map_controller.hunterLayer.destroy();
	}
	if(ProtectorGame.map_controller.objectLayer != null) {
		ProtectorGame.map_controller.objectLayer.destroy();
	}

	ProtectorGame.map_controller.map.destroy();
	if(ProtectorGame.map_controller.cursor_highlighter.toggled == true) {
		ProtectorGame.map_controller.toggle_cursor_highlighter(game);
	}

	//clear zaun's restore energy timer
	if(ProtectorGame.zaun.timerId != null) {
		console.log("<map_controller> clearing zaun timer");
		clearInterval(ProtectorGame.zaun.timerId);
		ProtectorGame.zaun.timerId = null;
	}

	//remove player from the game
	if(ProtectorGame.player != null) {
		ProtectorGame.player.body = null;
		ProtectorGame.player.destroy();
	}

	//tell zaun to reset all loaded object
	ProtectorGame.zaun.resetTiles();

	for(var i=0; i < ProtectorGame.map_controller.loadedObjects.length; i++) {
		ProtectorGame.map_controller.loadedObjects[i].body = null;
		ProtectorGame.map_controller.loadedObjects[i].destroy();
	}
	ProtectorGame.map_controller.loadedObjects = [];

	//remove all hunters from the map
	for(var i=0; i < ProtectorGame.hunter.hunters.length; i++) {
		ProtectorGame.hunter.hunters[i].body = null;
		ProtectorGame.hunter.hunters[i].destroy();
		ProtectorGame.hunter.reloading = [];
		for(var z=0; z < ProtectorGame.hunter.timerIDs.length; z++) {
			clearInterval(ProtectorGame.hunter.timerIDs[z]);
		}

	}
	ProtectorGame.hunter.hunters = [];

	for(var i=0; i < ProtectorGame.hunter.mobileHunters.length; i++) {
		ProtectorGame.hunter.mobileHunters[i].body = null;
		ProtectorGame.hunter.mobileHunters[i].destroy();

		for(var z=0; z < ProtectorGame.hunter.mobileTimerIds.length; z++) {
			clearInterval(ProtectorGame.hunter.mobileTimerIds[z]);
		}
	}
	ProtectorGame.hunter.mobileTimerIds = [];

	//remove all hunter objects from the game
	for(var i=0; i < ProtectorGame.hunter.loadedObjects.length; i++) {
		ProtectorGame.hunter.loadedObjects[i].body = null;
		ProtectorGame.hunter.loadedObjects[i].destroy();
	}
	ProtectorGame.hunter.loadedObjects = [];


	game.world.setBounds(0, 0, ProtectorGame.game.width, game.height);
}

/*
	This function will tell the map controller to start/stop a service that highlights the tile that the mouse cursor
	is currently hovering over


	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> The cursor_highlighter is started, and the tile under the mouse's current position 
								  is highlighted.
*/
ProtectorGame.map_controller.toggle_cursor_highlighter = function(game) {
	ProtectorGame.map_controller.cursor_highlighter.toggle();
}

/*
	This function highlights a group of cells in the currently loaded tilemap. If the game state is not "in_game", this
	function will do nothing.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.
								cells - An array containing all the tile objects to highlight

	POSTCONDITIONS		: 		> All tiles specified in the cells array parameter are highlighted
*/
ProtectorGame.map_controller.highlight_tiles = function(game, cells) {
	for(var i=cells.length-1; i >= 0; i--) {
		this.backgroundLayer.dirty = true;
		cells.savedPath[i].alpha = 0.5;
	} 
}

/*
	This function creates a new item over the tile at the world coordinates 
	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.
								item - name of the sprite to load in

	POSTCONDITIONS		: 		> All tiles specified in the cells array parameter are highlighted
*/
ProtectorGame.map_controller.place_item = function(game, item) {
	//first check to see if this selected tile is in the blocked layer. if so, do nothing...
	if(ProtectorGame.map_controller.cursor_highlighter.selectedTile == null) {
		return;
	}

	//don't allow user to place item if energy is low
	if(ProtectorGame.zaun.energy == 0) {
		return;
	}

	//if allowed to place item,use energy to do so
	ProtectorGame.zaun.useEnergy();

	//if the selected tile's x&y are equal to that of an object, dont place that item
	for(var i=0; i < ProtectorGame.map_controller.loadedObjects.length; i++) {
		var selectedX = ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldX;
		var thisX =  ProtectorGame.map_controller.loadedObjects[i].position.x;

		var selectedY = ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldY;
		var thisY = ProtectorGame.map_controller.loadedObjects[i].position.y

		if(selectedX == thisX && selectedY == thisY) {
			return;
		}
	}

	//if the selected tile's x&y are equal to that of a hunter, dont place the item
	for(var i=0; i < ProtectorGame.hunter.hunters.length; i++) {
		var selectedX = ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldX;
		var thisX =  ProtectorGame.hunter.hunters[i].position.x;

		var selectedY = ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldY;
		var thisY = ProtectorGame.hunter.hunters[i].position.y

		if(selectedX == thisX && selectedY == thisY) {
			return;
		}
	}

	//add the item at the selected tile's coords
	var tmpObj = game.add.sprite(ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldX, ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldY, item);
	ProtectorGame.map_controller.loadedObjects.push(tmpObj);	//add item to loaded items cache so it can be deleted later.

	//if the item placed was a wall, make it a rigid object so the player can't walk through it
	if(tmpObj.key == "wall_item") {
		//give this item physics
		game.physics.arcade.enable(tmpObj);
		tmpObj.body.immovable = true;
		ProtectorGame.map_controller.rigid_objects.add(tmpObj);
		//ProtectorGame.map_controller.rigid_objects.bringToTop(tmpObj);
		console.log(tmpObj.key);	//NOTE :: THIS CAN BE USED TO DETERMINE WHAT TYPE OF ITEM THIS OBJECT IS! THEREFORE AI CAN USE THIS!
	}
	if(tmpObj.key == "road_item") {
		game.physics.arcade.enable(tmpObj);
		ProtectorGame.map_controller.roads.add(tmpObj);
	}
	if(tmpObj.key == "bridge_item") {
		tmpObj.animations.add('place', [0, 1], 2, false);
		tmpObj.animations.play('place');
		ProtectorGame.place_beacon.play();
		if(ProtectorGame.map_controller.lastBeacon != null) {
			//fade out previous beacon, then destroy it
			//ProtectorGame.game.add.tween(ProtectorGame.map_controller.lastBeacon).to({alpha: 0}, 500, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(function() {
				ProtectorGame.map_controller.lastBeacon.destroy();
			//}, this);
		}
		ProtectorGame.map_controller.lastBeacon = tmpObj;
	}

	//make sure player sprite stays on top
	ProtectorGame.player.bringToTop();
}


ProtectorGame.map_controller.update = function(game) {
	if(ProtectorGame.map_controller.cursor_highlighter.toggled == true) {
		ProtectorGame.map_controller.cursor_highlighter.update(game);
	}
	if(ProtectorGame.state == ProtectorGame.states.in_game) {
		ProtectorGame.zaun.update(ProtectorGame.game);
	}
}
