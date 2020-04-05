function ShitheadPlayer(name) {
	this.name = name;
	this.hand = [];
	this.face_up = [];
	this.face_down = [];
			
	this.add_card = function(card,place) {
		if(place == "hand"){
			this.hand.push(card);
		} else if(place == 'fu') {
			this.face_up.push(card);
		} else if(place == 'fd') {
			this.face_down.push(card);
		} else {
			throw "Unknown card destination... hacks?";
		}
	}
	
	this.pop_card = function(index,place) {
		if(place == "hand"){
			return this.hand.splice(index,1);
		} else if(place == 'fu') {
			return this.face_up.splice(index,1);
		} else if(place == 'fd') {
			return this.face_down.splice(index,1);
		} else {
			throw "Unknown card destination... hacks?";
		}
	}
}

module.exports = {
	ShitheadPlayer: ShitheadPlayer
};