
	//implements the A* pathfinding algorithm to create a path from the current player location to the location
	//of the mouse click
	findPath: function(initX, initY, finalX, finalY) {

		//set of nodes done being considered
		var closedSet = [];

		//list of currently discovered nodes (current node + neighbors) waiting to be evaluated. First tile
		//to add to open set is the start tile
		var startTile = {
			tile: this.map.getTileWorldXY(initX, initY),
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
		console.log(this.map.getTileWorldXY(finalX, finalY, 64, 64, this.map.backgroundLayer, true));
			
		if(this.map.getTileWorldXY(finalX, finalY, 64, 64, this.blockedLayer, true) != null) return;

		console.log("TARGET - X : " + finalX + " , Y : " + finalY);
		while(openSet.length != 0) {
		//for(var z=0; z < 50; z++) {
			//if were at the target, done with the loop
			if(selected != null && selected.worldX == finalX && selected.worldY == finalY) {
				console.log("ALGO FOUND TARGET!!");
				found = true;
				break;
			}

			if(selected != null) {
				console.log("selected - X : " + selected.worldX + " , Y : " + selected.worldY);
			}

			//get fScores every loop iteration
			var fScores = [];

			//compute the f scores of all the tiles in the open set
			fScores = this.getFScores(openSet, selected, finalX, finalY);
			console.log(fScores);

			//loop through fScores and find the index of lowest score
			var lowestScore = fScores[0];
			var lowestIndex = 0;

			for(var i=1; i < fScores.length; i++) {
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
			adjacentTiles = this.getAdjacentTiles(selected);

			//now for all adjacent tiles NOT already in the openSet, add to openSet
			for(var i=0; i < adjacentTiles.length; i++) {
				//don't consider this node if it has already been considered
				if(this.arrayContains(adjacentTiles[i], closedSet)) {
					continue;
				}

				//check to see if this node is in the open set. If not, add it. else, check if it is a better path
				if(!this.arrayContains(adjacentTiles[i], openSet)) {
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

		//if the tile was not found then that means it was either invalid (not in the map) or unreachable. don't trigger movement and return.
		if(!found) return;

		//now reconstruct the path by backtracking from the target location, through the parents, back to the start
		var path = [];	//the array to hold the final path
		var atTile = closedSet[closedSet.length - 1];	//this holds the next tile to add to the path

		while(atTile != null) {
		//for(vari=0; i < 20; i++) {
			path.push(atTile.tile);
			atTile = atTile.parent;
		}
		console.log(path);

		//set the vals required to start movement
		this.currentlyMoving = true;
		this.currentPath = path;
		this.savedPath =  [];
		for(var i=0; i < path.length; i++) {
			this.savedPath.push(path[i]);
		}
	},

	//had to make my own helper method to check for element in array because jQuery doesn't f$%&ing work. . .
	//PARAMS : element - element in the array to check, must be of same type
	//		   arr     - array to search
	arrayContains: function(element, arr) {
		for(var i=0; i < arr.length; i++) {
			if(arr[i].tile == element) return true
		}
		return false;
	},

	//quick helper method that will get the gScore of one tile, given the current tile considered and the target
	//tile which MUST be adjacent to currentTile.
	gscore: function(currentTile, targetTile) {
		if(currentTile.worldX == targetTile.worldX || currentTile.worldY == targetTile.worldY) return 10;	//adj
			else return 14;	//diagonal tile
	},

	//This helper method will return an array containing all the walkable adjacent tiles of the tile given
	//in the parameter. A tile is walkable as long as it is not in the blockedLayer of the tile map, a.k.a. it
	//is a wall or some other form of immovable object
	getAdjacentTiles: function(tile) {
		//tmp tile to hold value to consider
		var tmpTile;
		//array of adjacent tiles to return at the end of the function
		var adjTiles = [];

		//** NOTE : tile.x IS THE VIEWPORT-RELATIVE X VALUE, tile.worldX IS THE WORLD MAP X VALUE **//

		//get tile above
		tmpTile = this.map.getTileWorldXY(tile.worldX, tile.worldY - 64);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX, tile.worldY - 64, 64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//get tile right
		tmpTile = this.map.getTileWorldXY(tile.worldX + 64, tile.worldY);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX + 64, tile.worldY, 64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//get tile below
		tmpTile = this.map.getTileWorldXY(tile.worldX, tile.worldY + 64);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX, tile.worldY + 64, 64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//get tile left
		tmpTile = this.map.getTileWorldXY(tile.worldX - 64, tile.worldY);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX - 64, tile.worldY,64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//get tile topLeft
		tmpTile = this.map.getTileWorldXY(tile.worldX - 64, tile.worldY - 64);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX - 64, tile.worldY - 64, 64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//get tile topRight
		tmpTile = this.map.getTileWorldXY(tile.worldX + 64, tile.worldY - 64);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX + 64, tile.worldY - 64, 64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//get tile bottomRight
		tmpTile = this.map.getTileWorldXY(tile.worldX + 64, tile.worldY + 64);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX + 64, tile.worldY + 64, 64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//get tile bottomLeft
		tmpTile = this.map.getTileWorldXY(tile.worldX - 64, tile.worldY + 64);
		if(tmpTile != undefined && this.map.getTileWorldXY(tile.worldX - 64, tile.worldY + 64, 64, 64, this.blockedLayer, true) == null) adjTiles.push(tmpTile);
		if(tmpTile != undefined && this.gscore(tile, tmpTile) == 14 && (this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY - 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX, tmpTile.worldY + 64, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX - 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null
										|| this.map.getTileWorldXY(tmpTile.worldX + 64, tmpTile.worldY, 64, 64, this.blockedLayer, true) != null)) adjTiles.pop();

		//finally, return the array of valid tiles
		return adjTiles;
	},

	//This method will compute the F score (G + H) of all the tiles in the parameter array, arr. It also takes 
	//the x&y coords of the target tile as parameter to calculate hScore, as well as a reference to the currently
	//selected tile. 
	getFScores: function(arr, currentTile, targetX, targetY) {
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
	},

	//moves the player to the tile specified by the coordinates in the params
	movePlayer: function(xCoord, yCoord) {
		var xMove = false;
		var set = false;

		var up = 0;
		var down = 0;
		var left = 0;
		var right = 0;
		//set the target point
		this.targetX = xCoord;
		this.targetY = yCoord;

		//this.game.add.tween(this.player).to({x: parseInt(xCoord), y: parseInt(yCoord), 250, Phaser.Easing.Quadratic,InOut, true});
		//console.log("FROM : " + parseInt(this.player.x) + "," + parseInt(this.player.y) + " TO : " + parseInt(xCoord) + "," + parseInt(yCoord));
		if(this.player.x > xCoord - this.MAX_ERROR && this.player.x < xCoord + this.MAX_ERROR && this.player.y > yCoord - this.MAX_ERROR && this.player.y < yCoord + this.MAX_ERROR) {
			this.currentPath.pop();
			this.player.body.velocity.x = 0;
			this.player.body.velocity.y = 0;
			this.currentlyMoving = false;
			return;
		}

		//the player will need to travel in the +x direction (right)
		if(this.player.x < xCoord-this.MAX_ERROR) {
			this.player.animations.play('walking_right');
			this.dir = "right";
			xMove = true;
			set = true;
			right = 1;
		}
		//the player will neeed to travel in the -x direction (left)
		if(this.player.x > xCoord+this.MAX_ERROR) {
			this.player.animations.play('walking_left');
			this.dir = "left";
			xMove = true;
			set = true;

			left = 1;
		}
		//the player will need to travel in the -y direction (up)
		if(this.player.y > yCoord+this.MAX_ERROR) {
			if(!xMove) this.player.animations.play('walking_up');
			this.dir = "up";
			set = true;
			up = 1;
		}
		//the player will need to travel in the +y direction (down)
		if(this.player.y < yCoord-this.MAX_ERROR) {
			if(!xMove) this.player.animations.play('walking_down');
			this.dir = "down";
			set = true;
			down = 1;
		}

		//move to the tile
		this.moveTile(up, down, left, right);
		//this.player.body.position.y = parseInt(yCoord);
		//this.player.body.position.x = parseInt(xCoord);
		if(!set) {
			this.player.animations.stop();
			this.currentlyMoving = false;
		}
	},

	//helper function, moves the player up one tile in the specified direction, given by integer params
	//USAGE : to move, say, up&right, use moveTile(1, 0, 0, 1);
	moveTile: function(up, down, left, right) {
		if(up > 0) this.player.body.velocity.y = -this.vel;
		if(down > 0) this.player.body.velocity.y = this.vel;

		if(left > 0) this.player.body.velocity.x = -this.vel;
		if(right > 0) this.player.body.velocity.x = this.vel;
	},

	//find objects in a Tiled layer that contains a property called "type" equal to a certain value
	findObjectsByType: function(type, map, layer) {
		var result = new Array();
		//Phaser uses top left, Tile bottom left so we have to adjust the y position
		map.objects[layer].forEach(function(element) {
			element.y -= map.tileHeight;
			result.push(element);
		});
		return result;
	}
}