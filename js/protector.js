///////////////////////////////////////////////////////////////////////////////////////////////////
// protector.js - CSE 380 Final Project												 	 		 //
//																								 //
// Protector is a single-player topdown game in which the player must manipulate the environment //
// to protect their zombie self from getting into trouble. The tilesets and map were created     //
// using the "Tiled" tilemap creation software. The graphics were made using the online sprite   //
// drawing app, "Piskel". The Phaser Javascript game engine is employed to create this game.	 //
//																							     //
// (c) 2017 Team Protector																		 //
//																								 //
// Authors: Daniel Gomm, Noam Dorogoyer, Tristen Terracciano									 //
//																								 //
///////////////////////////////////////////////////////////////////////////////////////////////////

//create a global object to store everything in. This will allow us to split up the code into multiple source files. 
//this line must be at the beginning of *every* source file in the game!
var ProtectorGame = ProtectorGame || {};

/*USAGE: Phaser.Game(width (pixels), height(pixels), rendering_context(Phaser.CANVAS, 
Phaser.WEBGL, or Phaser.AUTO), DOM_element_ID (element ID to insert the canvas created by 
Phaser, blank will be appended to body), {function references}(object containing 4 references 
to essential Phaser functions. Not required but allows for faster prototyping)) */
ProtectorGame.game = new Phaser.Game(1280, 768, Phaser.AUTO, '', { preload: preload, create: create, update: update });

//Define all game states -- keep in mind these are not Phaser game states, but our own defined states to determine what
//the ui is to display, as well as decide some other things that happen in the main loop
ProtectorGame.states = {loading: "loading", main_menu: "main_menu", levels_menu: "levels_menu", options_menu: "options_menu", help_menu: "help_menu", in_game: "in_game", game_over: "game_over", level_complete: "level_complete", paused: "paused", cheat: "cheat"};

//The current game state. It starts as "unitialized" and then gets initialized to "loading" after preload is run.
ProtectorGame.state = "uninitialized";

//sound file references. may be transferred to another file audio_manager.js in the future
ProtectorGame.main_theme;
ProtectorGame.level1_theme;
ProtectorGame.help_fanfare;
ProtectorGame.thunder;
ProtectorGame.place_beacon;

//This happens before the game starts. Load in all images and spritesheets here
function preload() {
	//tell the game ui to initialize. 
	ProtectorGame.ui.initialize(ProtectorGame.game);
	
	//set the game state to loading while the game loads
	ProtectorGame.state = ProtectorGame.states.loading;

	//load in audio assets. this responsibility may be transferred to a new file audio_manager.js in the future
	ProtectorGame.game.load.audio('main_theme', 'assets/audio/ProtectorMainTheme.mp3');
	ProtectorGame.game.load.audio('level1_theme', 'assets/audio/level1_theme.mp3');
	ProtectorGame.game.load.audio('help_fanfare', 'assets/audio/help_fanfare.mp3');
	ProtectorGame.game.load.audio('thunder', 'assets/audio/thunder.mp3');
	ProtectorGame.game.load.audio('place_beacon', 'assets/audio/beacon_place.mp3');

	//display game logo while game is loading. . .
	ProtectorGame.ui.changeState(ProtectorGame.game);

	//This will tell Phaser to show as much as browser window can fit
	ProtectorGame.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	//have the game centered horizontally
	ProtectorGame.game.scale.pageAlignHorizontally = true;
	ProtectorGame.game.scale.pageAlignVertically = true;
	
	//now load in main game sprites: main character, tileset, tilemap, enemies, antidotes, etc.
	ProtectorGame.map_controller.initialize(ProtectorGame.game);
	
	//load in the player spritesheet/assets
	ProtectorGame.zaun.initialize(ProtectorGame.game);

	//load in all assets for the enemy hunters
	ProtectorGame.hunter.initialize(ProtectorGame.game);
}

//This happens after preload but before the game is run. The assets loaded in can be instantiated here.
function create() {
	document.getElementById("logo").src = "";
	//add in other sprites and spritesheets to the game -- main character, enemies, tilemap, tilesets, initialize animations, etc.
	ProtectorGame.main_theme = ProtectorGame.game.add.audio('main_theme');
	ProtectorGame.level1_theme = ProtectorGame.game.add.audio('level1_theme');
	ProtectorGame.help_fanfare = ProtectorGame.game.add.audio('help_fanfare');
	ProtectorGame.thunder = ProtectorGame.game.add.audio('thunder');
	ProtectorGame.place_beacon = ProtectorGame.game.add.audio('place_beacon');

	//loading complete. update the game state to main_menu, and update the ui to represent the current game state
	ProtectorGame.state = ProtectorGame.states.main_menu;
	ProtectorGame.ui.changeState(ProtectorGame.game);
}

//This is the main game loop. 
function update() {
	//Update the ui for any user feedback
	ProtectorGame.ui.update(ProtectorGame.game);
	ProtectorGame.map_controller.update(ProtectorGame.game);
	ProtectorGame.hunter.update(ProtectorGame.game);

	ProtectorGame.ui.bringAllToTop();
}

