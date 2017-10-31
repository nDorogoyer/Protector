///////////////////////////////////////////////////////////////////////////////////////////////////
// ui.js - CSE 380 Final Project												 	 		 	 //
//																								 //
// This source file contains all the game UI elements for Protector. This includes the loading   //
// screen, main menu, in game ui, and pause menu. All methods and variables will be contained in //
// the main game object, ProtectorGame. The UI can be accessed from any other game file by       //
// referencing ProtectorGame.ui. 																 //
//																							     //
// (c) 2017 Team Protector																		 //
//																								 //
// Authors: Daniel Gomm, Noam Dorogoyer, Tristen Terracciano									 //
//																								 //
///////////////////////////////////////////////////////////////////////////////////////////////////

//Ensure global game object is defined
var ProtectorGame = ProtectorGame || {};

//Instantiate the ui object inside of the global game object
ProtectorGame.ui = {};

//Define all ui element variables. These variables are objects whose element variable will be assigned a reference 
//to the corresponding Phaser game object when it is loaded into the game. Elements that are not currently loaded into 
//the game are set to null. Each ui object has the following structure:
//									obj = {
//										element : holds Phaser game object reference
//									    elementType : holds a string containing the type of ui element
//										onclick = function(game) : function to handle a click on this element
//									}
//										
var logo = {};	//logo image
logo.element;
logo.elementType = "img";
logo.onclick = function(game) {
	//nothing here. . .
}

var title = {};	//title image
title.element;
title.elementType = "img";
title.onclick = function(game) {
	//nothing here. . . 
}

var levels_title = {};	//levels title image
levels_title.element;
levels_title.elementType = "img";
levels_title.onclick = function(game) {
	//nothing here. . .
}

var options_title = {};	//options title image
options_title.element;
options_title.elementType = "img";
options_title.onclick = function(game) {
	//nothing here. . .
}

var help_title = {};	//help title image
help_title.element;
help_title.elementType = "img";
help_title.onclick = function(game) {
	//nothing here. . .
}

var health_bar = {};
health_bar.element;
health_bar.elementType = "uilbl";
health_bar.onclick = function(game) {
	//nothing here. . .
}

var energy_bar = {};
energy_bar.element;
energy_bar.elementType = "uilbl";
energy_bar.onclick = function(game) { 
	//nothing here. . .
}

var game_end_overlay = {};
game_end_overlay.element;
game_end_overlay.elementType = "uilbl";
game_end_overlay.onclick = function(game) {
	//nothing here. . .
}

//Define ui items available to be placed in the map
var itm_road = {};
itm_road.item;
itm_road.itemType = "road";
itm_road.use = function(game) {
	//tell map to place a road 
	ProtectorGame.map_controller.place_item(game, 'road_item');
}

var itm_wall = {};
itm_wall.item;
itm_wall.itemType = "wall";
itm_wall.use = function(game) {
	//tell map to place a wall
	ProtectorGame.map_controller.place_item(game, 'wall_item');
}

var itm_bridge = {};
itm_bridge.item;
itm_bridge.itemType = "bridge";
itm_bridge.use = function(game) {
	//tell map to place a bridge
	ProtectorGame.map_controller.place_item(game, 'bridge_item');
}

var itm_ult = {};
itm_ult.item;
itm_ult.itemType = "ult";
itm_ult.timerId;
itm_ult.onCooldown = false;
itm_ult.use = function(game) {
	if(itm_ult.onCooldown == true) return;
	//tell map to use ult
	var screenDim = game.add.sprite(0, 0, 'minimap_cursor');
	screenDim.alpha = 0;
	screenDim.scale.setTo(40, 48);
	screenDim.fixedToCamera = true;

	//uses all your energy
	ProtectorGame.zaun.energy = 0;
	ProtectorGame.ui.updateEnergyBar();

	var thunder;

	//now dim the screen and wait for thunder
	ProtectorGame.game.add.tween(screenDim).to({alpha: 0.5}, 1000, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(function() {
		ProtectorGame.thunder.play();
		ProtectorGame.thunder.volume = 0.7;
		thunder = game.add.sprite(ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldX, ProtectorGame.map_controller.cursor_highlighter.selectedTile.worldY, 'spr_thunder');
		game.physics.arcade.enable(thunder);
		game.physics.arcade.overlap(thunder, ProtectorGame.hunter.hunters, ProtectorGame.hunter.smite, null, this);
		game.physics.arcade.overlap(thunder, ProtectorGame.hunter.mobileHuntersGroup, ProtectorGame.hunter.smite, null, this);
		thunder.animations.add('strike', [0,1,2], 5, false);
		thunder.animations.play('strike');


		ProtectorGame.game.add.tween(screenDim).to({alpha: 0}, 1000, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(function() {
			//now that thunder has complete, ult goes on cooldown and can't be used (btn_ult removed from loadedButtons until timer ends)
			screenDim.destroy();
			thunder.destroy();
			try {
				btn_ult.element.frame = 3;
				itm_ult.onCooldown = true;
				ProtectorGame.loadedButtons.pop();	
			}
			catch(err) {
				//if this button no longer exists when the callback happens, then jsut return
				return;
			}

			itm_ult.timerId = setInterval(function() {
				itm_ult.onCooldown = false;
				ProtectorGame.loadedButtons.push(btn_ult);
				btn_ult.element.frame = 0;
				clearInterval(itm_ult.timerId);
			}, 30000);
		}, this);
	}, this);
}

//Define all ui buttons
var btn_levels = {};	//levels main menu button
btn_levels.element;
btn_levels.elementType ="btn";
btn_levels.onclick = function(game) {
	//change state 
	ProtectorGame.state = ProtectorGame.states.levels_menu;
	ProtectorGame.ui.changeState(game);
}

var btn_options = {};
btn_options.element;
btn_options.elementType = "btn";
btn_options.onclick = function(game) {
	//change state
	ProtectorGame.state = ProtectorGame.states.options_menu;
	ProtectorGame.ui.changeState(game);
}

var btn_help = {};
btn_help.element;
btn_help.elementType = "btn";
btn_help.onclick = function(game) {
	//change state
	ProtectorGame.state = ProtectorGame.states.help_menu;
	ProtectorGame.ui.changeState(game);
}

var btn_level1 = {};
btn_level1.element;
btn_level1.elementType = "btn";
btn_level1.onclick = function(game) {
	//start level 1. . . 
	ProtectorGame.map_controller.load_map(game, 0);
	ProtectorGame.state = ProtectorGame.states.in_game;
	ProtectorGame.ui.changeState(game);
}

var btn_level2 = {};
btn_level2.element;
btn_level2.elementType = "btn";
btn_level2.onclick = function(game) {
	//start level 2. . .
	ProtectorGame.map_controller.load_map(game, 1);
	ProtectorGame.state = ProtectorGame.states.in_game;
	ProtectorGame.ui.changeState(game);
}

var btn_level3 = {};
btn_level3.element;
btn_level3.elementType = "btn";
btn_level3.onclick = function(game) {
	//start level 3. . .
	ProtectorGame.map_controller.load_map(game, 2);
	ProtectorGame.state = ProtectorGame.states.in_game;
	ProtectorGame.ui.changeState(game);
}

var btn_main_menu = {};
btn_main_menu.element;
btn_main_menu.elementType = "btn";
btn_main_menu.onclick = function(game) {
	//unload the map if there is a map loaded into the game
	if(ProtectorGame.map_controller.map != null) {
		ProtectorGame.map_controller.close_map(game);
	}

	//go back to main menu
	ProtectorGame.state = ProtectorGame.states.main_menu;
	ProtectorGame.ui.changeState(game);
}

var btn_restart = {};
btn_restart.element;
btn_restart.elementType = "btn";
btn_restart.onclick = function(game) {
	//restart the current level
	if(ProtectorGame.map_controller.lastMapIndex >= 0) {
		ProtectorGame.map_controller.load_map(game, ProtectorGame.map_controller.lastMapIndex);
		ProtectorGame.state = ProtectorGame.states.in_game;
		ProtectorGame.ui.changeState(game);
	}
}

var btn_road = {};
btn_road.element;
btn_road.elementType = "btn";
btn_road.mapped_key;
btn_road.onclick = function(game) {
	//allow user to place a road
	ProtectorGame.ui.selectedItem = itm_road;
	ProtectorGame.map_controller.toggle_cursor_highlighter(game);
}

var btn_wall = {};
btn_wall.element;
btn_wall.elementType = "btn";
btn_wall.mapped_key;
btn_wall.onclick = function(game) {
	//allow user to place a wall
	ProtectorGame.ui.selectedItem = itm_wall;
	ProtectorGame.map_controller.toggle_cursor_highlighter(game);
}

var btn_bridge = {};
btn_bridge.element;
btn_bridge.elementType = "btn";
btn_bridge.mapped_key;
btn_bridge.onclick = function(game) {
	//allow user to place a bridge
	ProtectorGame.ui.selectedItem = itm_bridge;
	ProtectorGame.map_controller.toggle_cursor_highlighter(game);
}

var btn_ult = {};
btn_ult.element;
btn_ult.elementType = "btn";
btn_ult.mapped_key;
btn_ult.onclick = function(game) {
	//allow the user to use ultimate ability
	ProtectorGame.ui.selectedItem = itm_ult;
	ProtectorGame.map_controller.toggle_cursor_highlighter(game);
}

var title_background;
var minimap_level1;
var minimap_level2;
var minimap_level3;
var minimap_cursor;

//in-game ui labels
var road_label;
var wall_label;
var bridge_label;
var ultimate_label;
var title_banner;


//Define objects to organize and store all currently loaded ui elements
ProtectorGame.loadedButtons = [];

//This object contains a lsit of all available items for the user to use (provided by btns in the in-game ui overlay)
ProtectorGame.ui.items = {road: "road", wall: "wall", bridge: "bridge", ult: "ult"};

//This object will hold a string containing the name of the item currently selected by the user. This can have (4) values:
//				1. "road"
//				2. "wall"
//				3. "bridge"
//				4. "ult"
//	This will tell the map_controller which item to place when map_controller.cursor_highlighter registers a mouse click over
//	a tile! These values are contained in ProtectorGame.ui.items object, and should be referenced through the object in case
//  more abilities are added in future revisions.
ProtectorGame.ui.selectedItem = null;

//This object contains the default keymappings for the game ui
ProtectorGame.ui.defaultKeymaps = {road: Phaser.Keyboard.Q, wall: Phaser.Keyboard.W, bridge: Phaser.Keyboard.E, ult: Phaser.Keyboard.R};

//This object contains the current keymappings for the in-game ui items
ProtectorGame.ui.keymaps = {road: null, wall: null, bridge: null, ult: null};

//variable used for clean button presses
var btnPressed = false;

//variable used to hold reference to a key in between when it is pressed and when it is released
var currentKeyDown = null;

//variable used to hold the index of the button in the loadedButtons array that is mapped to the current key being pressed
var selectedBtnIndex = -1;

//variable used for clean keyboard press
var keyPressed = false;

//variables used for clean level cheat key press. These keys are in a different loop so another var is used to prevent errors.
var cheatKeyPressed1 = false;
var cheatKeyPressed2 = false;
var cheatKeyPressed3 = false;
var cheatKeyPressed4 = false;

/*
	This function returns true if the mouse pointer is currently hovering over an element of the ui overlay. This function is used
	by map_controller to avoid tile selection mismatches when placing an element on the map.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> The function has returned true if the mouse pointer is over a ui overlay element, false otherwise
*/
ProtectorGame.ui.pointerOverUIOverlay = function(game) {
	//loop through all buttons loaded in the game
	for(var i=0; i < ProtectorGame.loadedButtons.length; i++) {
		//If mouse hovers over the button, change the frame that highlights the text, so the user knows its working
		if(ProtectorGame.loadedButtons[i].element.input.pointerOver()) {
			return true;
		}
	}

	return false;
}

ProtectorGame.ui.updateHealthBar = function() {
	if(ProtectorGame.zaun.invincible == true) return;

	if(ProtectorGame.zaun.health == 100) health_bar.element.frame = 0;
	if(ProtectorGame.zaun.health == 80) health_bar.element.frame = 1;
	if(ProtectorGame.zaun.health == 60) health_bar.element.frame = 2;
	if(ProtectorGame.zaun.health == 40) health_bar.element.frame = 3;
	if(ProtectorGame.zaun.health == 20) health_bar.element.frame = 4;
	if(ProtectorGame.zaun.health == 0) {
		health_bar.element.frame = 5;
		ProtectorGame.state = ProtectorGame.states.game_over;
	}
}

ProtectorGame.ui.updateEnergyBar = function() {
	if(ProtectorGame.zaun.invincible == true || energy_bar.element == null) return;

	if(ProtectorGame.zaun.energy == 100) energy_bar.element.frame = 0;
	if(ProtectorGame.zaun.energy == 80) energy_bar.element.frame = 1;
	if(ProtectorGame.zaun.energy == 60) energy_bar.element.frame = 2;
	if(ProtectorGame.zaun.energy == 40) energy_bar.element.frame = 3;
	if(ProtectorGame.zaun.energy == 20) energy_bar.element.frame = 4;
	if(ProtectorGame.zaun.energy == 0) energy_bar.element.frame = 5;
}

ProtectorGame.ui.bringAllToTop = function(game) {
	for(var i=0; i < ProtectorGame.loadedButtons.length; i++) {
		ProtectorGame.loadedButtons[i].element.bringToTop();
	}

	if(ProtectorGame.map_controller.lastMapIndex == 0) {
		minimap_level1.bringToTop();
	}
	if(ProtectorGame.map_controller.lastMapIndex == 1) {
		minimap_level2.bringToTop();
	}
	if(ProtectorGame.map_controller.lastMapIndex == 2) {
		minimap_level3.bringToTop();
	}
}

/*
	This function initializes the game UI. This will load in the game logo, all button spritesheets, and
	all in-game HUD spritesheets/sprites.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> All ui sprites and spritesheets are loaded properly into the Phaser game object, 
								  ProtectorGame.game
*/
ProtectorGame.ui.initialize = function(game) {
	console.log("<ui> : Initializing. . . ");

	//initialize the keymaps to their defaults
	ProtectorGame.ui.keymaps.road = ProtectorGame.ui.defaultKeymaps.road;
	ProtectorGame.ui.keymaps.wall = ProtectorGame.ui.defaultKeymaps.wall;
	ProtectorGame.ui.keymaps.bridge = ProtectorGame.ui.defaultKeymaps.bridge;
	ProtectorGame.ui.keymaps.ult = ProtectorGame.ui.defaultKeymaps.ult;

	//now tell the in-game item buttons what keys they are mapped to initially
	btn_road.mapped_key = ProtectorGame.ui.keymaps.road;
	btn_wall.mapped_key = ProtectorGame.ui.keymaps.wall;
	btn_bridge.mapped_key = ProtectorGame.ui.keymaps.bridge;
	btn_ult.mapped_key = ProtectorGame.ui.keymaps.ult; 

	//hide the options table until it is needed.
	document.getElementById("OPTIONS_TABLE").style.display = "none";

	//T - Fixing the issue with the html not scrolling properly
	document.body.style = "overflow: auto;"
	
	//hide the help table until it is needed
	document.getElementById("HELP_TABLE").style.display = "none";

	document.getElementById("INFO_TABLE").style.display = "none";

	//load in game logo and title images
	game.load.image('title_banner', 'assets/title_banner.png');
	game.load.image('game_logo', 'assets/zaun.png');
	game.load.image('game_title', 'assets/protector_title.png');
	game.load.image('levels_title', 'assets/levels_title.png');
	game.load.image('options_title', 'assets/options_title.png');
	game.load.image('help_title', 'assets/help_title.png');
	game.load.image('title_background', 'assets/title_background.png');
	game.load.image('minimap_level1', 'assets/minimap_level1.png');
	game.load.image('minimap_level2', 'assets/minimap_level2.png');
	game.load.image('minimap_level3', 'assets/minimap_level3.png');
	game.load.image('minimap_cursor', 'assets/minimap_cursor.png');
	game.load.image('road_label', 'assets/road_label.png');
	game.load.image('wall_label', 'assets/wall_label.png');
	game.load.image('bridge_label', 'assets/bridge_label.png');
	game.load.image('ultimate_label', 'assets/ultimate_label.png');

	//load in all button spritesheets
	//														   width, height
	game.load.spritesheet('btn_levels', 'assets/btn_levels.png', 128, 64);
	game.load.spritesheet('btn_options', 'assets/btn_options.png', 128, 64);
	game.load.spritesheet('btn_help', 'assets/btn_help.png', 128, 64);
	game.load.spritesheet('btn_level1', 'assets/btn_level1.png', 128, 64);
	game.load.spritesheet('btn_level2', 'assets/btn_level2.png', 128, 64);
	game.load.spritesheet('btn_level3', 'assets/btn_level3.png', 128, 64);
	game.load.spritesheet('btn_main_menu', 'assets/btn_main_menu.png', 128, 64);
	game.load.spritesheet('btn_road', 'assets/btn_road.png', 96, 64);
	game.load.spritesheet('btn_wall', 'assets/btn_wall.png', 96, 64);
	game.load.spritesheet('btn_bridge', 'assets/btn_beacon.png', 96, 64);
	game.load.spritesheet('btn_ult', 'assets/btn_ult.png', 96, 64);
	game.load.spritesheet('btn_restart', 'assets/btn_restart.png', 128, 64);

	//load in all in-game ui labels
	game.load.spritesheet('health_bar', 'assets/Health_Bar.png', 32, 32);
	game.load.spritesheet('energy_bar', 'assets/energy_bar.png', 32, 32);
	game.load.spritesheet('game_end_overlay', 'assets/GameEnd_Overlay.png', 256, 128);

	//load in all in-game item tile sprites
	game.load.image('road_item', 'assets/road_tile.png');
	game.load.image('wall_item', 'assets/wall_tile.png');
	game.load.spritesheet('bridge_item', 'assets/beacon_tile_spritesheet.png', 64, 64);
	game.load.spritesheet('spr_thunder', 'assets/thunder_spritesheet.png', 210, 160);

	console.log("<ui> : done.");
};

/*
	This function tells the ui that a state change has occurred. It will update the ui to reflect the current game state.
	This functionality is separate from the update loop because it is possible for a state change to happen outside of 
	the main game update loop. Thus, this function allows for asynchronous state change in the ui (it can change out of 
	sync with the main loop). This also is more efficient because it resolves the issue of the ui update function 
	constantly reloading the ui controls into the game every iteration.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> The ui has been updated to reflect the current state
								> All ui elements no longer needed are removed from the game
*/
ProtectorGame.ui.changeState = function(game) {
	//first, clear out all current ui elements, then load in whichever ones are needed
	if(logo.element != null) {
		logo.element.body = null;
		logo.element.destroy();
		logo.element = null;
	}
	if(title.element != null) {
		title.element.body = null;
		title.element.destroy();
		title.element = null;
	}
	if(levels_title.element != null) {
		levels_title.element.body = null;
		levels_title.element.destroy();
		levels_title.element = null;
	}
	if(options_title.element != null) {
		options_title.element.body = null;
		options_title.element.destroy();
		options_title.element = null;
	}
	if(help_title.element != null) {
		help_title.element.body = null;
		help_title.element.destroy();
		help_title.element = null;
	}
	if(btn_levels.element != null) {
		btn_levels.element.body = null;
		btn_levels.element.destroy();
		btn_levels.element = null;
	}
	if(btn_options.element != null) {
		btn_options.element.body = null;
		btn_options.element.destroy();
		btn_options.element = null;
	}
	if(btn_help.element != null) {
		btn_help.element.body = null;
		btn_help.element.destroy();
		btn_help.element = null;
	}
	if(btn_level1.element != null) {
		btn_level1.element.body = null;
		btn_level1.element.destroy();
		btn_level1.element = null;
	}
	if(btn_level2.element != null) {
		btn_level2.element.body = null;
		btn_level2.element.destroy();
		btn_level2.element = null;
	}
	if(btn_level3.element != null) {
		btn_level3.element.body = null;
		btn_level3.element.destroy();
		btn_level3.element = null;
	}
	if(btn_main_menu.element != null) {
		btn_main_menu.element.body = null;
		btn_main_menu.element.destroy();
		btn_main_menu.element = null;
	}
	if(btn_restart.element != null) {
		btn_restart.element.body = null;
		btn_restart.element.destroy();
		btn_restart.element = null;
	}
	if(btn_road.element != null) {
		btn_road.element.body = null;
		btn_road.element.destroy();
		btn_road.element = null;
	}
	if(btn_wall.element != null) {
		btn_wall.element.body = null;
		btn_wall.element.destroy();
		btn_wall.element = null;
	}
	if(btn_bridge.element != null) {
		btn_bridge.element.body = null;
		btn_bridge.element.destroy();
		btn_bridge.element = null;
	}
	if(btn_ult.element != null) {
		clearInterval(itm_ult.timerId);
		itm_ult.onCooldown = false;
		btn_ult.element.body = null;
		btn_ult.element.destroy();
		btn_ult.element = null;
	}
	if(health_bar.element != null) {
		health_bar.element.body = null;
		health_bar.element.destroy();
		health_bar.element = null;
	}
	if(energy_bar.element != null) {
		energy_bar.element.body = null
		energy_bar.element.destroy();
		energy_bar.element = null;
	}
	if(game_end_overlay.element != null) {
		game_end_overlay.element.body = null;
		game_end_overlay.element.destroy();
		game_end_overlay.element = null;
	}
	if(road_label != null) {
		road_label.destroy();
	}
	if(bridge_label != null) {
		bridge_label.destroy();
	}
	if(wall_label != null) {
		wall_label.destroy();
	}
	if(ultimate_label != null) {
		ultimate_label.destroy();
	}

	//then, clear all cache objects
	ProtectorGame.loadedButtons = [];

	//pause all audio
	if(ProtectorGame.main_theme != null && ProtectorGame.state != ProtectorGame.states.levels_menu && ProtectorGame.state != ProtectorGame.states.options_menu) {
		ProtectorGame.main_theme.pause();
	}
	if(ProtectorGame.level1_theme != null) {
		ProtectorGame.level1_theme.pause();
	}
	if(ProtectorGame.help_fanfare != null) {
		ProtectorGame.help_fanfare.pause();
	}
	if(title_background != null && ProtectorGame.state == ProtectorGame.states.in_game) {
		title_background.destroy();
	}
	if(minimap_level1 != null) {
		minimap_level1.destroy();
	}
	if(minimap_level2 != null) {
		minimap_level2.destroy();
	}
	if(minimap_level3 != null) {
		minimap_level3.destroy();
	}
	if(minimap_cursor != null) {
		minimap_cursor.destroy();
	}
	if(title_banner != null) {
		title_banner.destroy();
	}

	//reset the table display option to hide.
	document.getElementById("OPTIONS_TABLE").style.display = "none";

	//hide the help table until it is needed
	document.getElementById("HELP_TABLE").style.display = "none";

	//hife the info table until it is needed
	document.getElementById("INFO_TABLE").style.display = "none";

	//now update ui elements based on the current state
	//display loading screen
	if(ProtectorGame.state == ProtectorGame.states.loading) {
		//logo.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2, ProtectorGame.game.world.height/2, 'game_logo');
		document.getElementById("logo").src = "/assets/zaun.png";
	}
	//display main menu
	else if(ProtectorGame.state == ProtectorGame.states.main_menu) {
		//title_background = ProtectorGame.game.add.tileSprite(0, 0, 1280, 768, 'title_background');
		if(title_background == null) {
			title_background = ProtectorGame.game.add.sprite(0, 0, 'title_background');
		}

		//title_background.scale.setTo(1.5, 2);
		title_background.alpha = 0.8;
		title_banner = ProtectorGame.game.add.sprite(0, 120, 'title_banner');
		//title_banner = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 170, 120, 'title_banner');
		title_banner.alpha = 0.5;
		title_banner.scale.setTo(1, 0.7);
		//title_banner.scale.setTo(0.3, 0.7);
		title.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 100, 100, 'game_title');
		btn_levels.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 300, 'btn_levels');
		btn_levels.element.inputEnabled = true;
		btn_options.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 400, 'btn_options');
		btn_options.element.inputEnabled = true;
		btn_help.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 500, 'btn_help');
		btn_help.element.inputEnabled = true;

		//handle audio
		ProtectorGame.main_theme.play();

		//finally, put all the loaded buttons into the cache object so they can be easily referenced by the update function
		ProtectorGame.loadedButtons = [btn_levels, btn_options, btn_help];
	}
	//display levels menu
	else if(ProtectorGame.state == ProtectorGame.states.levels_menu) {
		title_banner = ProtectorGame.game.add.sprite(0, 120, 'title_banner');
		title_banner.alpha = 0.5;
		title_banner.scale.setTo(1, 0.7);
		levels_title.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 100, 100, 'levels_title');
		/*btn_level1.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 300, 'btn_level1');
		btn_level1.element.inputEnabled = true;
		btn_level2.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 400, 'btn_level2');
		btn_level2.element.inputEnabled = true;
		btn_level3.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 500, 'btn_level3');
		btn_level3.element.inputEnabled = true;
		btn_main_menu.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 600, 'btn_main_menu');
		btn_main_menu.element.inputEnabled = true;*/
		btn_level1.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 + 20, 235, 'btn_level1');
		btn_level1.element.inputEnabled = true;
		btn_level2.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 + 230, 235, 'btn_level2');
		btn_level2.element.inputEnabled = true;
		btn_level3.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 + 450, 235, 'btn_level3');
		btn_level3.element.inputEnabled = true;
		btn_main_menu.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 650, 'btn_main_menu');
		btn_main_menu.element.inputEnabled = true;

		minimap_level1 = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 20, 350, 'minimap_level1');
		minimap_level1.scale.setTo(0.5, 0.5);
		minimap_level2 = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 + 200, 350, 'minimap_level2');
		minimap_level2.scale.setTo(0.5, 0.5);
		minimap_level3 = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 + 420, 350, 'minimap_level3');
		minimap_level3.scale.setTo(0.5, 0.5);


		document.getElementById("INFO_TABLE").style.display = "block";

		//finally, put all the loaded buttons into the button cache object
		ProtectorGame.loadedButtons = [btn_level1, btn_level2, btn_level3, btn_main_menu];
	}
	//display options menu
	else if(ProtectorGame.state == ProtectorGame.states.options_menu) {
		title_banner = ProtectorGame.game.add.sprite(0, 120, 'title_banner');
		title_banner.alpha = 0.5;
		title_banner.scale.setTo(1, 0.7);
		options_title.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 100, 100, 'options_title');
		btn_main_menu.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 600, 'btn_main_menu');
		btn_main_menu.element.inputEnabled = true;

		//display the options table
		document.getElementById("OPTIONS_TABLE").style.display = "block";

		//finally, put all the loaded buttons into the button cache object
		ProtectorGame.loadedButtons = [btn_main_menu];
	}
	//display help menu
	else if(ProtectorGame.state == ProtectorGame.states.help_menu) {
		title_banner = ProtectorGame.game.add.sprite(0, 120, 'title_banner');
		title_banner.alpha = 0.5;
		title_banner.scale.setTo(1, 0.7);
		help_title.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 100, 100, 'help_title');
		btn_main_menu.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 600, 'btn_main_menu');
		btn_main_menu.element.inputEnabled = true;

		//display the help table
		document.getElementById("HELP_TABLE").style.display = "block";

		//play help fanfare
		ProtectorGame.main_theme.pause();
		ProtectorGame.help_fanfare.play();
		ProtectorGame.help_fanfare.volume = 0.3;

		//finally, put all the loaded buttons into the button cache object
		ProtectorGame.loadedButtons = [btn_main_menu];
	}
	//display in-game ui
	else if(ProtectorGame.state == ProtectorGame.states.in_game) {
		title_background = null;
		//load ability buttons
		btn_road.element = ProtectorGame.game.add.sprite(50, 40, 'btn_road');
		btn_road.element.inputEnabled = true;
		btn_road.element.fixedToCamera = true;
		road_label = game.add.sprite(50, 20, 'road_label');
		road_label.scale.setTo(0.8, 0.8);
		road_label.fixedToCamera = true;
		road_label.visible = false;
		btn_wall.element = ProtectorGame.game.add.sprite(150, 40, 'btn_wall');
		btn_wall.element.inputEnabled = true;
		btn_wall.element.fixedToCamera = true;
		wall_label = game.add.sprite(150, 20, 'wall_label');
		wall_label.scale.setTo(0.8, 0.8);
		wall_label.fixedToCamera = true;
		wall_label.visible = false;
		btn_bridge.element = ProtectorGame.game.add.sprite(250, 40, 'btn_bridge');
		btn_bridge.element.inputEnabled = true;
		btn_bridge.element.fixedToCamera = true;
		bridge_label = game.add.sprite(250, 18, 'bridge_label');
		bridge_label.scale.setTo(0.9, 0.9);
		bridge_label.fixedToCamera = true;
		bridge_label.visible = false;
		btn_ult.element = ProtectorGame.game.add.sprite(350, 40, 'btn_ult');
		btn_ult.element.inputEnabled = true;
		btn_ult.element.fixedToCamera = true;
		ultimate_label = game.add.sprite(350, 17, 'ultimate_label');
		ultimate_label.fixedToCamera = true;
		ultimate_label.visible = false;

		//load health bar
		health_bar.element = ProtectorGame.game.add.sprite(80, 100, 'health_bar');
		health_bar.element.fixedToCamera = true;
		health_bar.element.scale.setTo(2, 2);

		//load energy bar
		energy_bar.element = ProtectorGame.game.add.sprite(180, 100, 'energy_bar');
		energy_bar.element.fixedToCamera = true;
		energy_bar.element.scale.setTo(2, 2);

		//load main menu button
		btn_main_menu.element = ProtectorGame.game.add.sprite(1100, 40, 'btn_main_menu');
		btn_main_menu.element.inputEnabled = true;
		btn_main_menu.element.fixedToCamera = true;

		//load minimap based on selected level
		if(ProtectorGame.map_controller.lastMapIndex == 0) {
			minimap_level1 = ProtectorGame.game.add.sprite(1025, 525, 'minimap_level1');
			minimap_level1.fixedToCamera = true;
			minimap_level1.scale.setTo(0.5, 0.5);
			minimap_level1.alpha = 0.7;
		}
		if(ProtectorGame.map_controller.lastMapIndex == 1) {
			minimap_level2 = ProtectorGame.game.add.sprite(1025, 525, 'minimap_level2');
			minimap_level2.fixedToCamera = true;
			minimap_level2.scale.setTo(0.5, 0.5);
			minimap_level2.alpha = 0.7;
		}
		if(ProtectorGame.map_controller.lastMapIndex == 2) {
			minimap_level3 = ProtectorGame.game.add.sprite(1025, 525, 'minimap_level3');
			minimap_level3.fixedToCamera = true;
			minimap_level3.scale.setTo(0.5, 0.5);
			minimap_level3.alpha = 0.7;
		}

		minimap_cursor = ProtectorGame.game.add.sprite(1025, 525, 'minimap_cursor');
		minimap_cursor.fixedToCamera = true;
		//minimap_cursor.alpha = 0.9;

		//play level theme
		ProtectorGame.level1_theme.loop = true;
		ProtectorGame.level1_theme.play();	//loop this one 

		//finally, put all loaded buttons into button cache object
		ProtectorGame.loadedButtons = [btn_main_menu, btn_road, btn_wall, btn_bridge, btn_ult];
	}
	//display game over ui
	else if(ProtectorGame.state == ProtectorGame.states.game_over) {
		game_end_overlay.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 100, 100, 'game_end_overlay');
		game_end_overlay.element.frame = 1;

		btn_restart.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 300, 'btn_restart');
		btn_restart.element.inputEnabled = true;
		btn_restart.element.fixedToCamera = true;
		btn_restart.element.bringToTop();

		btn_main_menu.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 400, 'btn_main_menu');
		btn_main_menu.element.inputEnabled = true;
		btn_main_menu.element.fixedToCamera = true;
		btn_main_menu.element.bringToTop();

		ProtectorGame.loadedButtons = [btn_restart, btn_main_menu];
	}
	//display victory ui
	else if(ProtectorGame.state == ProtectorGame.states.level_complete) {
		game_end_overlay.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 100, 100, 'game_end_overlay');
		game_end_overlay.element.frame = 0;

		btn_restart.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 300, 'btn_restart');
		btn_restart.element.inputEnabled = true;
		btn_restart.element.fixedToCamera = true;
		btn_restart.element.bringToTop();

		btn_main_menu.element = ProtectorGame.game.add.sprite(ProtectorGame.game.world.width/2 - 40, 400, 'btn_main_menu');
		btn_main_menu.element.inputEnabled = true;
		btn_main_menu.element.fixedToCamera = true;
		btn_main_menu.element.bringToTop();

		ProtectorGame.loadedButtons = [btn_restart, btn_main_menu];
	}
};

/*
	This function is the main update function for the ui. It should be called for every iteration of the main game
	loop. It processes user input and provides feedback for certain actions.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> Any ui elements that have been interacted with give proper feedback
*/
ProtectorGame.ui.update = function(game) {
	if(ProtectorGame.state == ProtectorGame.states.in_game) {
		if(!ProtectorGame.level1_theme.isPlaying) {
			console.log("<ui> looping game music !");
			ProtectorGame.level1_theme.play();
		}

		if(minimap_cursor != null) {
			minimap_cursor.cameraOffset.x = 1025 + ( (game.camera.x / ( 64*(ProtectorGame.map_controller.width+1)) ) * 404 * 0.5);
			minimap_cursor.cameraOffset.y = 525 + ( (game.camera.y / ( 64*(ProtectorGame.map_controller.height+1)) ) * 399 * 0.5);
		}
	}

	if(ProtectorGame.state == ProtectorGame.states.game_over || ProtectorGame.state == ProtectorGame.states.level_complete) {
		//MAKE SURE STATE CHANGE ONLY HAPPENS DURING UI UPDATE FUNCTION !!
		if(ProtectorGame.map_controller.map != null) {
			ProtectorGame.map_controller.close_map(ProtectorGame.game);
		}
		ProtectorGame.ui.changeState(ProtectorGame.game);
		ProtectorGame.state = ProtectorGame.states.paused;
	}

	//level cheats ! ;)
	if(!cheatKeyPressed1 && !cheatKeyPressed2 && !cheatKeyPressed3 && game.input.keyboard.isDown(Phaser.Keyboard.ONE)) {
		if(ProtectorGame.map_controller.map != null) {
			ProtectorGame.map_controller.close_map(game);
			ProtectorGame.state = ProtectorGame.states.cheat;	//we need this so map_controller doesnt update zaun while btn is pressed
		}
		cheatKeyPressed1 = true;
		console.log("1 down");
	}
	else if(cheatKeyPressed1 && !game.input.keyboard.isDown(Phaser.Keyboard.ONE)) {
		console.log("1 up");
		cheatKeyPressed1 = false;
		//basically does the exact same thing as if the level1 button in levels menu was pressed. 
		ProtectorGame.map_controller.load_map(game, 0);
		ProtectorGame.state = ProtectorGame.states.in_game;
		ProtectorGame.ui.changeState(game);
		
	}

	if(!cheatKeyPressed2 && !cheatKeyPressed3 && !cheatKeyPressed1 && game.input.keyboard.isDown(Phaser.Keyboard.TWO)) {
		if(ProtectorGame.map_controller.map != null) {
			ProtectorGame.map_controller.close_map(game);
			ProtectorGame.state = ProtectorGame.states.cheat;	//we need this so map_controller doesnt update zaun while btn is pressed
		}
		cheatKeyPressed2 = true;
		console.log("2 down");
	}
	else if(cheatKeyPressed2 && !game.input.keyboard.isDown(Phaser.Keyboard.TWO)) {
		console.log("2 up");
		cheatKeyPressed2 = false;
		//basically does the exact same thing as if the level2 button in levels menu was pressed. 
		ProtectorGame.map_controller.load_map(game, 1);
		ProtectorGame.state = ProtectorGame.states.in_game;
		ProtectorGame.ui.changeState(game);
	}

	if(!cheatKeyPressed3 && !cheatKeyPressed1 && !cheatKeyPressed2 && game.input.keyboard.isDown(Phaser.Keyboard.THREE)) {
		if(ProtectorGame.map_controller.map != null) {
			ProtectorGame.map_controller.close_map(game);
			ProtectorGame.state = ProtectorGame.states.cheat;	//we need this so map_controller doesnt update zaun while btn is pressed
		}
		cheatKeyPressed3 = true;
		console.log("3 down");
	}
	else if(cheatKeyPressed3 && !game.input.keyboard.isDown(Phaser.Keyboard.THREE)) {
		console.log('3 up');
		cheatKeyPressed3 = false;
		//basically does the exact same thing as if the level3 button in levels menu was pressed. 
		ProtectorGame.map_controller.load_map(game, 2);
		ProtectorGame.state = ProtectorGame.states.in_game;
		ProtectorGame.ui.changeState(game);
	}

	if(!cheatKeyPressed4 && game.input.keyboard.isDown(Phaser.Keyboard.I)) {
		cheatKeyPressed4 = true;
	}
	else if(cheatKeyPressed4 && !game.input.keyboard.isDown(Phaser.Keyboard.I)) {
		ProtectorGame.zaun.invincible = !ProtectorGame.zaun.invincible;
		cheatKeyPressed4 = false;
	}

	//handle on-hover help labels
	if(ProtectorGame.state == ProtectorGame.states.in_game) {
		if(ProtectorGame.ui.pointerOverUIOverlay() == true) {
			road_label.visible = true;
			wall_label.visible = true;
			bridge_label.visible = true;
			ultimate_label.visible = true;
		}
		else {
			road_label.visible = false;
			wall_label.visible = false;
			bridge_label.visible = false;
			ultimate_label.visible = false;
		}
	}
	
	//handle option menu key binding changes.
	if(ProtectorGame.state == ProtectorGame.states.options_menu) {
		//update road keybind
		var road_opt = document.getElementById("road_key");
		var road_keybinding = road_opt.options[road_opt.selectedIndex].text;
		ProtectorGame.ui.changeKeybind(btn_road, road_keybinding);

		//update wall keybind
		var wall_opt = document.getElementById("wall_key");
		var wall_keybinding = wall_opt.options[wall_opt.selectedIndex].text;
		ProtectorGame.ui.changeKeybind(btn_wall, wall_keybinding);

		//update bridge keybind
		var bridge_opt = document.getElementById("bridge_key");
		var bridge_keybinding = bridge_opt.options[bridge_opt.selectedIndex].text;
		ProtectorGame.ui.changeKeybind(btn_bridge, bridge_keybinding);

		//update ult keybind
		var ult_opt = document.getElementById("ult_key");
		var ult_keybinding = ult_opt.options[ult_opt.selectedIndex].text;
		ProtectorGame.ui.changeKeybind(btn_ult, ult_keybinding);
	}

	for(var i=0; i < ProtectorGame.loadedButtons.length; i++) {
		//If mouse hovers over the button, change the frame that highlights the text, so the user knows its working
		if(ProtectorGame.loadedButtons[i].element.input.pointerOver()) {
			//pointerDown() is a function of the InputHandler class, tells if the mouse button has been clicked
			if(ProtectorGame.loadedButtons[i].element.input.pointerDown()) {
				ProtectorGame.loadedButtons[i].element.frame = 2;
				btnPressed = true;
			}
			else ProtectorGame.loadedButtons[i].element.frame = 1;	//if just hovering and no click, change frame to highlighted btn text

			//don't register a button click event until the pointer has done a full click (click down adn release)
			if(btnPressed && ProtectorGame.loadedButtons[i].element.input.pointerUp()) {
				btnPressed = false;
				ProtectorGame.loadedButtons[i].onclick(game);
				break;	//break out of loop to avoid null pointer errors
			}	
		}
		else {
			//go back to normal button if mouse not hovering over
			ProtectorGame.loadedButtons[i].element.frame = 0;
		}

		//if user presssed mapped key, then also process button press
		if(ProtectorGame.loadedButtons[i].mapped_key != null) {
			if(game.input.keyboard.isDown(ProtectorGame.loadedButtons[i].mapped_key)) {
				ProtectorGame.loadedButtons[i].element.frame = 2;
				keyPressed = true;
				currentKeyDown = ProtectorGame.loadedButtons[i].mapped_key;
				selectedBtnIndex = i;
			}
			else if(keyPressed && !game.input.keyboard.isDown(currentKeyDown) && i == selectedBtnIndex) {
				keyPressed = false;
				currentKeyDown = null;
				selectedBtnIndex = -1;
				ProtectorGame.loadedButtons[i].onclick(game);
				break;
			}
		}
	}
}

/*
	This function is a simple helper function that changes the keybinding of the item specified in the parameter

	PARAMS				: 		item - A reference to the item object whose keybinding is to be updated
								key - A string containing the letter key to be binded

	POSTCONDITIONS		: 		> The item object referred to by the 'item' parameter is updated to be binded
								  to the new key.
*/
ProtectorGame.ui.changeKeybind = function(item, key) {
	if(key == "Q") {
		item.mapped_key = Phaser.Keyboard.Q;
	}
	else if(key == "W") {
		item.mapped_key = Phaser.Keyboard.W;
	}
	else if(key == "E") {
		item.mapped_key = Phaser.Keyboard.E;
	}
	else if(key == "R") {
		item.mapped_key = Phaser.Keyboard.R;
	}
}