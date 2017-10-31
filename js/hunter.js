///////////////////////////////////////////////////////////////////////////////////////////////////
// hunter.js - CSE 380 Final Project												 	 		 //
//																								 //
// This source file contains handling and creating multiple hunter enemies . It contains the AI  //
// for the character, as well as loading all animations, and handling all interactions with the  //
// environment, other NPCs, and Zaun himself. Hunters will be stationary enemies, and thus will	 //
// not follow zaun if they spot him. If a hunter spots zaun (or any other zombies), they will    //
// shoot at the target from their location, and will stop shooting if the target reaches a       //
// certain threshold distance from the hunter.													 //
//																							     //
// (c) 2017 Team Protector																		 //
//																								 //
// Authors: Daniel Gomm, Noam Dorogoyer, Tristen Terracciano									 //
//																								 //
///////////////////////////////////////////////////////////////////////////////////////////////////

//Ensure global game object is defined
var ProtectorGame = ProtectorGame || {};

var vel = 80;

//the global hunter object. note that this object is a holder object for all hunters and their ai & pathfinding functions, not a reference
//to an actual game object
ProtectorGame.hunter = {};

//global array containing all hunters loaded into the game
ProtectorGame.hunter.hunters = [];

//global array containing all mobile hunters loaded into the game
ProtectorGame.hunter.mobileHunters = [];

//array that holds the id for the random movement timer at the corresponding index of the mobileHunters[] array. ex: mobileTimerIds[0] gets
//the random movement timer id for the hunter referenced by mobileHunters[0].
ProtectorGame.hunter.mobileTimerIds = [];

//holds the enable bit for the mobile hunters movement change
ProtectorGame.hunter.changeDir;

//array that holds a bit (0 or 1) that tells whether or not the hunter at the corresponding index of the hunters[] array is reloading (unable
//to shoot). ex: reloading[0] = 1; says that the hunter referenced by hunters[0] cannot fire.
ProtectorGame.hunter.reloading = [];

//array that holds the id for the reload timer for the hunter at the corresponding index of the hunters[] array. ex: timerIDs[0] gets the reload
//timer id for the hunter referenced by hunters[0]. Hunters have their reload timer id initialized to -1 upon creation, which means that there
//is no reload timer for this hunter yet.
ProtectorGame.hunter.timerIDs = [];

//array holding all objects currently loaded into the game that were added by a hunter
ProtectorGame.hunter.loadedObjects = [];

//Phaser.Group object containing all bullets currently in the game
ProtectorGame.hunter.arrows;

//Phaser.Group object containing all mobile hunters. These guys will need to use physics to collide with blockedLayer, rigid_objects, and enemies
ProtectorGame.hunter.mobileHuntersGroup;

/*
	This function initializes the hunter global object. All spritesheets and other data associated with the hunters are loaded into 
	the game in this function

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> All images loaded into the game.
*/
ProtectorGame.hunter.initialize = function(game) {
	console.log("<Hunter> initializing. . .");
	
	//load spritesheet
	//game.load.spritesheet('hunter', 'assets/64px/hunter64.png', 64, 64);
	game.load.image('hunter', 'assets/64px/hunter64.png');
	game.load.image('mobileHunter', 'assets/64px/hunter64.png');
	game.load.image('arrow', 'assets/arrow.png');

	console.log("<Hunter> done.");
}

/*
	This function creates a new hunter entity at the specified tile in the game. The new hunter's Phaser.Sprite object reference will
	be saved in the ProtectorGame.hunter.hunters array. Note that this function takes TILE x&y coordinates as parameters, meaning that
	the caller must convert the coordinates to tile coordinates.

	A hunter created by this function will be a static enemy; they will remain static and shoot at the player if they get close.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.
							    tileX - The x coordinate of the tile to place the hunter in
							    tileY - The y coordinate of the tile to place the hunter in

	POSTCONDITIONS		: 		> A hunter is spawned into the game and ready to go.
*/
ProtectorGame.hunter.create = function(game, tileX, tileY) {
	var tmp = game.add.sprite(tileX*64, tileY*64, 'hunter');

	//enable physics
	game.physics.arcade.enable(tmp);

	//zaun can't push these guys -- at least not yet
	tmp.body.immovable = true;

	//add hunter to enemies group in map_controller so zaun cannot travel through enemies!
	ProtectorGame.map_controller.enemies.add(tmp);
	ProtectorGame.map_controller.enemies.bringToTop(tmp);

	ProtectorGame.hunter.animations.add('walking_right', [0, 1, 2, 3], 15, true);
	ProtectorGame.hunter.animations.add('walking_left', [4, 5, 6, 7], 15, true);
	ProtectorGame.hunter.animations.add('attacking_left', [8, 9, 10, 11, 12, 13], 15, true);
	ProtectorGame.hunter.animations.add('attacking_right', [14, 15, 16, 17, 18, 19], 15, true);
	ProtectorGame.hunter.animations.add('idle', [20], 15, true);
	
	//finally, push this hunter to the global hunters array, and initialize its corresponding values in the other info arrays
	ProtectorGame.hunter.hunters.push(tmp);
	ProtectorGame.hunter.reloading.push(0);
	ProtectorGame.hunter.timerIDs.push(-1);
}

/*
	This function creates a new mobile hunter entity at the specified tile in the game. The new hunter's Phaser.Sprite object reference will
	be saved in the ProtectorGame.hunter.hunters array. Note that this function takes TILE x&y coordinates as parameters, meaning that
	the caller must convert the coordinates to tile coordinates. 

	A hunter created by this function will be a mobile hunter who can walk around the map. The movement of these mobile hunters will be random
	and is not dictated by a pathfinding algorithm. Instead, they will be given random velocities at a set interval. These hunters will be 
	armed with swords and can only attack the player if they come within one tile of the mobile hunter.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.
							    tileX - The x coordinate of the tile to place the hunter in
							    tileY - The y coordinate of the tile to place the hunter in

	POSTCONDITIONS		: 		> A mobile hunter is spawned into the game and ready to go
*/
ProtectorGame.hunter.createMobile = function(game, tileX, tileY) {
	var tmp = game.add.sprite(tileX*64, tileY*64, 'mobileHunter');

	//enable physics so this hunter can collide with other objects
	game.physics.arcade.enable(tmp);
	tmp.enableBody = true;
	tmp.body.collideWorldBounds = true;

	//add hunter to enemies group in map_controller so zaun cannot travel through enemies!
	//ProtectorGame.map_controller.enemies.add(tmp);
	ProtectorGame.hunter.mobileHuntersGroup.add(tmp);
	ProtectorGame.map_controller.enemies.bringToTop(tmp);

	//finally, push this hunter to the global hunters array, and initialize its corresponding values in the other info arrays
	ProtectorGame.hunter.mobileHunters.push(tmp);

	var id = setInterval(function() {
		ProtectorGame.hunter.changeDir = true;
	}, 4000);
	ProtectorGame.hunter.mobileTimerIds.push(id);
	ProtectorGame.hunter.changeDir = true;
}

ProtectorGame.hunter.smite = function(thunder, hunter) {
	hunter.body = null;
	hunter.destroy();
}

ProtectorGame.hunter.blockArrow = function(arrow, obj) {
	arrow.body = null;
	arrow.destroy();
}

/*
	This is the main update function for all hunter entities, and gets called once for every game loop iteration. If the game state is 
	ProtectorGame.states.in_game, it will handle detection of the player by each hunter. This means it will loop through each hunter in 
	the list, check if it is within 2 tiles of the player, and if so, shoot at fixed intervals. Otherwise, the hunter will remain inactive.

	PARAMS				: 		game - A reference to the Phaser game object, which doesn't get created until the main 
									   game script is run.

	POSTCONDITIONS		: 		> All hunters are active only if they are within 2 tiles of the player
*/
ProtectorGame.hunter.update = function(game) {
	//only update hunters if the game state is in_game
	if(ProtectorGame.state == ProtectorGame.states.in_game) {
		//bypass game crash that happens when the arrow hits two walls at the same time
		try {
			game.physics.arcade.overlap(ProtectorGame.hunter.arrows, ProtectorGame.map_controller.rigid_objects, ProtectorGame.hunter.blockArrow, null, this);	//collide with walls and other rigid bodies
		}
		catch(err) {
			console.log("overlap error! -> " + err);
		}

		//handle physics
		game.physics.arcade.collide(ProtectorGame.hunter.mobileHuntersGroup, ProtectorGame.map_controller.blockedLayer);
		game.physics.arcade.collide(ProtectorGame.hunter.mobileHuntersGroup, ProtectorGame.map_controller.rigid_objects);
		game.physics.arcade.collide(ProtectorGame.hunter.mobileHuntersGroup, ProtectorGame.map_controller.enemies);

		//loop through all mobile hunters and handle their random movement
		if(ProtectorGame.hunter.changeDir == true) {
			ProtectorGame.hunter.changeDir = false;
			for(var i=0; i < ProtectorGame.hunter.mobileHunters.length; i++) {
				try {
					var posX = Math.random();
					var posY = Math.random();
					//console.log("posX : " + posX + "posY : " + posY);
					if(posX > 0.5)
					{
						ProtectorGame.hunter.mobileHunters[i].body.velocity.x = vel;
						ProtectorGame.hunter.animations.play('walking_right');
					}
					else
					{
						ProtectorGame.hunter.mobileHunters[i].body.velocity.x = -vel;
						ProtectorGame.hunter.animations.play('walking_left');
					}
					if(posY > 0.5)
					{
						ProtectorGame.hunter.mobileHunters[i].body.velocity.y = vel;
					}
					else
					{
						ProtectorGame.hunter.mobileHunters[i].body.velocity.y = -vel;	
					}
					//console.log("VELOCITY FOR HUNTER " + i + " : x=" +  ProtectorGame.hunter.mobileHunters[i].body.velocity.x + " y="+ProtectorGame.hunter.mobileHunters[i].body.velocity.y);
				}
				catch(err) {
					console.log("ERROR MOVING MOBILE HUNTER " + i + " !! -> " + err);
				}
			}
		}
		

		//loop through all hunters and see if they are within 4 tiles of the player
		for(var i=0; i < ProtectorGame.hunter.hunters.length; i++) {
			if(Math.abs(ProtectorGame.hunter.hunters[i].x/64 - ProtectorGame.player.x/64) > 4 || Math.abs(ProtectorGame.hunter.hunters[i].y/64 - ProtectorGame.player.y/64) > 4) {
				//if this hunter is waiting to shoot but zombie is out of range, cancel the timer
				if(ProtectorGame.hunter.reloading[i] == 1) {
					ProtectorGame.hunter.reloading[i] = 0;
					clearInterval(ProtectorGame.hunter.timerIDs[i]);
				}
				continue;
			}
			else {
				if(ProtectorGame.hunter.reloading[i] == 0) {
					//shoot at the target
					console.log("<Hunter> hunter " + i + " shoots!");
					var arrow = game.add.sprite(ProtectorGame.hunter.hunters[i].x, ProtectorGame.hunter.hunters[i].y, 'arrow');
					ProtectorGame.hunter.loadedObjects.push(arrow);
					game.physics.arcade.enable(arrow);
					ProtectorGame.hunter.arrows.add(arrow);

					//using a kind of simple ai so that the hunter isnt TOO good at shooting, otherwise it will get frustrating
					if(ProtectorGame.player.x/32 > ProtectorGame.hunter.hunters[i].x/32) {
						arrow.body.velocity.x = 150;
						arrow.body.rotation += 180;
					}
					else if(ProtectorGame.player.x/32 < ProtectorGame.hunter.hunters[i].x/32) {
						arrow.body.velocity.x = -150;
					}
					else {
						arrow.body.velocity.x = 0;
					}

					if(ProtectorGame.player.y/32 < ProtectorGame.hunter.hunters[i].y/32) {
						arrow.body.velocity.y = -150;
						if(arrow.body.velocity.x > 0) arrow.body.rotation -= 45;
						else if(arrow.body.velocity.x < 0) arrow.body.rotation += 45;
						else arrow.body.rotation -= 90;
					}
					else if(ProtectorGame.player.y/32 > ProtectorGame.hunter.hunters[i].y/32) {
						arrow.body.velocity.y = 150;
						if(arrow.body.velocity.x > 0) arrow.body.rotation += 45;
						else if(arrow.body.velocity.x < 0) arrow.body.rotation -= 45;
						else arrow.body.rotation += 90;
					}
					else {
						arrow.body.velocity.y = 0;
					}

					if(ProtectorGame.hunter.timerIDs[i] != -1) {
						clearInterval(ProtectorGame.hunter.timerIDs[i]);
					}

					//start reloading after shooting
					ProtectorGame.hunter.reloading[i] = 1;

					var index = i;

					//start reload timer
					ProtectorGame.hunter.timerIDs[i] = setInterval(function() {
						console.log("<Hunter> hunter " + index + " reloaded.");
						ProtectorGame.hunter.reloading[index] = 0;
					}, 3000);
				}
			}
		}
	}
}


