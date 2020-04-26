var socket = io();
var canvas = document.getElementById('canvas');

canvas.width = 800;
canvas.height = 400;
var context = canvas.getContext('2d');
var fd_space = document.getElementById('fd_space')
var fu_space = document.getElementById('fu_space')
var hand_space = document.getElementById('hand_space')
var sidebar = document.getElementById('sidebar');
var game_log = document.getElementById('game-log')
var selected_space = document.getElementById('selected-space');
var buttonX = 300;
var buttonY = 300;
var buttonW = 200;
var buttonH = 40;
var button_enabled = true;

var player_id = "DEFAULT";
var in_turn = false;
var game_over = false;
var move_ready = false;
var game_state = {};
var selection = [];

var player_positions = 
	{"0":[210,10],
	"1":[410,10],
	"2":[610,10],
	"3":[610,150],
	"4":[610,300],
	"5":[410,300],
	"6":[210,300],
	"7":[10,300]}

function get_card(player,index,place) {
	if(place == "hand"){
		return player.hand[index];
	} else if(place == 'fu') {
		return player.face_up[index];
	} else if(place == 'fd') {
		return player.face_down[index];
	} else {
		throw "Unknown card destination... hacks?";
	}
}

socket.on('id', function(player) {
	player_id = player;
	console.log("Ok we know our id is: "+player_id)
});
socket.on('message', function(data) {
	var message = document.createElement("P");
	console.log(data)
	message.innerHTML = data;
	game_log.insertAdjacentElement('afterend',message);
});
socket.on('state',function(game) {
	game_state = game;
	players = game.players;
	game_ready = game.game_ready;
	
	context.clearRect(0,0,800,400);
	
	// Draw Players Box
	context.rect(10,10,100,200);
	context.fillStyle = 'black';
	context.stroke();
	context.font = '20px Arial';
	var offset = 30;
	context.fillText("Lobby:",20,offset)
	context.font = '10px Arial';
	for (var id in players) {
		offset += 15;
		var player = players[id];
		context.fillText(player.name,20,offset);		
	}
	
	if (!game.start){
		// Draw Start button if ready
		if(game_ready){
			context.fillStyle = 'blue';
			context.fillRect(buttonX,buttonY,buttonW,buttonH)
			context.stroke()
			context.font = '20px Arial';
			context.strokeText("Click to start game!",310,325)
			canvas.addEventListener('click', function(event) {
			// Control that click event occurred within position of button
			// NOTE: This assumes canvas is positioned at top left corner 
			  if (
				event.x > buttonX && 
				event.x < buttonX + buttonW &&
				event.y > buttonY && 
				event.y < buttonY + buttonH &&
				button_enabled
			  ) {
				// Executes if button was clicked!
				button_enabled = false;
				socket.emit('init');
			  }
			})
		}
	} else {		
		// Check if it's your turn
		if(game.game_over){ 
			context.font = '20px Arial';
			context.strokeText("Game over! Winner is "+game.players[game.winner].name,310,100)
			var [active,place] = get_active_hand(game.players[player_id]);
			var valid_numbers = get_valid_numbers(game);
			displayCards(game,active,place,valid_numbers);
			button_enabled = true;
			context.fillStyle = 'blue';
			context.fillRect(buttonX,buttonY,buttonW,buttonH)
			context.stroke()
			context.strokeText("Click to start game!",310,325)
			canvas.addEventListener('click', function(event) {
			// Control that click event occurred within position of button
			// NOTE: This assumes canvas is positioned at top left corner 
			  if (
				event.x > buttonX && 
				event.x < buttonX + buttonW &&
				event.y > buttonY && 
				event.y < buttonY + buttonH &&
				button_enabled
			  ) {
				// Executes if button was clicked!
				socket.emit('init');
				button_enabled = false;
			  }
			})
		} else if(Object.keys(game.players).includes(player_id)) {
			document.getElementById("ready_button").style.display = 'none';
			document.getElementById("swap_button").style.display = 'none';
			document.getElementById("play_button").style.display = 'block';
			button_enabled = true;
			var [active,place] = get_active_hand(game.players[player_id]);
			var valid_numbers = get_valid_numbers(game);
			displayCards(game,active,place,valid_numbers);
			if(game.current_turn == player_id) {
				document.title = 'Your turn, shithead!';
				document.getElementById('favicon').href = "static/images/favicon_not.ico";
				document.getElementById("play_button").style.display = 'block';
				//document.getElementById("play_button").disabled = false;
				valid_move = validMove(game);
				if(!valid_move && place != 'fd'){
					socket.emit('pickup')
					socket.emit('play');
				} 
			} else if(game.current_turn == "") {
				document.title = 'Shithead';
				document.getElementById('favicon').href = "static/images/poop.ico";
				if(game.players[player_id].face_up.length == 3 && !game.players[player_id].ready){
					document.getElementById("ready_button").style.display = 'block';
				}
				if(!game.players[player_id].ready) {
					document.getElementById("swap_button").style.display = 'block';
				}
				document.getElementById("play_button").style.display = 'none';
				//document.getElementById("ready_button").disabled = false;				
			} else {
				document.title = 'Shithead';
				document.getElementById('favicon').href = "static/images/poop.ico";
				document.getElementById("play_button").style.display = 'none';
				//document.getElementById("play_button").disabled = true;
			}
		} else {
			// Waiting;
			document.getElementById("ready_button").style.display = 'none';
			document.getElementById("swap_button").style.display = 'none';
			document.getElementById("play_button").style.display = 'none';
			document.getElementById("send_chat").style.display = 'none';
			
			context.font = '20px Arial';
			context.strokeText("Game in progress! Please wait...",310,325)
		}
	}
	
});

function getImage(number,suit) {
	return "/static/images/"+number+suit+".png"
}

function submitPlay() {
	if(move_ready){
		socket.emit('play');
	}
}

function get_active_hand(player) {
	if(player.hand.length == 0) {
		if(player.face_up.length ==0) {
			return [player.face_down,'fd'];
		} else {
			return [player.face_up,'fu'];
		}
	} else {
		return [player.hand,'hand'];
	}
}

function swapCards(){
	socket.emit('swapout',selection);
	selection = [];
}

function playerReady(){
	socket.emit('ready');
}

function submitChat(){
	var chat_text = document.getElementById('chat-body');
	socket.emit('chat',chat_text.value);
	chat_text.value = "";
}

function toggleSelection(){
	var idx = {"place":this.getAttribute('place'), "index":this.getAttribute('index')};
	if(selection.some(function(x){return x.index==idx.index && x.place == idx.place;})){
		selection.splice(selection.findIndex(function(x){return x.index==idx.index && x.place == idx.place}),1);
	} else {
		selection.push(idx);
	}
	selection.sort(function(a,b){return a.index - b.index})
}

function displayCards(game,active,place,valid_numbers) {
	context.font = '10px Arial';
	while (fd_space.lastElementChild) {
		fd_space.removeChild(fd_space.lastElementChild);
	}
	while (fu_space.lastElementChild) {
		fu_space.removeChild(fu_space.lastElementChild);
	}
	while (hand_space.lastElementChild) {
		hand_space.removeChild(hand_space.lastElementChild);
	}
	while (selected_space.lastElementChild) {
		selected_space.removeChild(selected_space.lastElementChild);
	}

	// Display fd
	ii = 0;
	for(const card of game.players[player_id].face_down){
		var div = document.createElement('div');
		div.innerHTML = '<img src="/static/images/red_back.png" height=80 width=53>'
		div.setAttribute('id','fd_'+ii);
		div.setAttribute('place','fd');
		div.setAttribute('index',ii);
		div.setAttribute('number',card.number);
		div.setAttribute('suit',card.suit);
		if(place == 'fd'){
			div.addEventListener('click',toggleSelection);
			div.setAttribute('class','valid');
		}
		fd_space.appendChild(div);
		ii += 1;
	}
	ii=0;
	// Display fu
	for(const card of game.players[player_id].face_up){
		var div = document.createElement('div')
		div.innerHTML = '<img src="'+getImage(card.number,card.suit)+'"height=80 width=53>'
		div.setAttribute('id','fu_'+ii);
		div.setAttribute('place','fu');
		div.setAttribute('index',ii);
		div.setAttribute('number',card.number);
		div.setAttribute('suit',card.suit);
		if((place == 'fu' && valid_numbers.includes(card.number)) || game.current_turn == "") {
			div.addEventListener('click',toggleSelection);
			div.setAttribute('class','valid');
		}
		fu_space.appendChild(div);
		ii += 1;
	}
	ii=0;
	// Display hand
	for(const card of game.players[player_id].hand){
		var div = document.createElement('div')
		div.innerHTML = '<img src="'+getImage(card.number,card.suit)+'"height=80 width=53>'
		div.setAttribute('id','hand_'+ii);
		div.setAttribute('place','hand');
		div.setAttribute('index',ii);
		div.setAttribute('number',card.number);
		div.setAttribute('suit',card.suit);
		if(place == 'hand' && valid_numbers.includes(card.number)){
			div.addEventListener('click',toggleSelection);
			div.setAttribute('class','valid')
		}
		hand_space.appendChild(div);
		ii += 1;
	}
	
	ii=0;
	// Display selection
	for(const idx of selection){
		var sel_card = get_card(game.players[player_id],idx.index,idx.place);
		var div = document.createElement('div')
		if(place == 'fd') {
			div.innerHTML = '<img src="/static/images/red_back.png" height=80 width=53>';
		} else {
			div.innerHTML = '<img src="'+getImage(sel_card.number,sel_card.suit)+'"height=80 width=53>';
		}
		div.setAttribute('id','select_'+ii);
		div.setAttribute('place',idx.place);
		div.setAttribute('index',idx.index);
		div.setAttribute('number',sel_card.number);
		div.setAttribute('suit',sel_card.suit);
		div.addEventListener('click',toggleSelection);
		selected_space.appendChild(div);
		ii += 1;
	}
	
	// Display other players 
	ii=0;
	for(const id of Object.keys(game.players)){
		// Display selection
		if(id != player_id) {
			context.fillText(game.players[id].name+" ("+game.players[id].hand.length+")",player_positions[ii][0],player_positions[ii][1]+90)
			for(let jj = 0; jj < 3; jj++){
				if(game.players[id].face_up.length < jj+1) {
					if(game.players[id].face_down.length >= jj+1) {
						var img = new Image(53,80);
						img.src = '/static/images/red_back.png';
						context.drawImage(img,player_positions[ii][0]+jj*53,player_positions[ii][1],53,80);	
					}
				} else {
					var img = new Image(53,80);
					img.src = getImage(game.players[id].face_up[jj].number,game.players[id].face_up[jj].suit);
					context.drawImage(img,player_positions[ii][0]+jj*53,player_positions[ii][1],53,80);
				}
			}
			ii += 1;
		}

	}
		
	context.font = '20px Arial';
	// Display discard_pile
	if(game.discard_pile.length > 0){
		if(game.discard_pile[game.discard_pile.length -1].number == 3 && game.discard_pile.length > 1){
			if(game.discard_pile[game.discard_pile.length -2].number == 3 && game.discard_pile.length > 2){
				if(game.discard_pile[game.discard_pile.length -3].number == 3 && game.discard_pile.length > 3){
					// Visualise top 4 cards
					var discard_offset = 0;
					for(const card of game.discard_pile.slice(-4,game.discard_pile.length)){
						var img = new Image(35,53);
						img.src = getImage(card.number,card.suit);
						context.drawImage(img,365+discard_offset,147,70,106);
						discard_offset += 20;
					}
					
				} else {
					// Visualise top three cards
					var discard_offset = 0;
					for(const card of game.discard_pile.slice(-3,game.discard_pile.length)){
						var img = new Image(35,53);
						img.src = getImage(card.number,card.suit);
						context.drawImage(img,365+discard_offset,147,70,106);
						discard_offset += 20;
					}
				}
			} else {
				// Visualise top two cards
				var discard_offset = 0;
				for(const card of game.discard_pile.slice(-2,game.discard_pile.length)){
					var img = new Image(35,53);
					img.src = getImage(card.number,card.suit);
					context.drawImage(img,365+discard_offset,147,70,106);
					discard_offset += 20;
				}
			}
		} else {
			// Visualise Top Card
			var img = new Image(35,53)
			img.src = getImage(game.discard_pile[game.discard_pile.length-1].number,game.discard_pile[game.discard_pile.length-1].suit)
			context.drawImage(img,365,147,70,106)
		}
	} else {
		// Visualise Empty Discard
		var img = new Image(35,53)
		img.src = '/static/images/red_back.png'
		context.drawImage(img,365,147,70,106)
	}
	
	// Display Remaining Deck Count
	context.font = '10px Arial';
	context.fillText("Deck: "+game.cards_left,320, 200)
}

function get_valid_numbers(game){
	
	// Construct valid numbers
    if(game.discard_pile.length == 0){
        var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","ACE"];
	} else if(game.discard_pile[game.discard_pile.length-1].number == 3) {
        if(game.discard_pile.length == 1){
            var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","ACE"];
        } else if(game.discard_pile[game.discard_pile.length-2].number == 3){
            if(game.discard_pile.length == 2){
                var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","ACE"];
            } else if(game.discard_pile[game.discard_pile.length-3].number ==3){
                if(game.discard_pile.length == 3){
                    var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","ACE"];
                } else {
                    var valid_numbers = game.discard_pile[game.discard_pile.length-4].valid_numbers
				}
			} else {
                var valid_numbers = game.discard_pile[game.discard_pile.length-3].valid_numbers
			}
		} else {
            var valid_numbers = game.discard_pile[game.discard_pile.length-2].valid_numbers
		}
    } else {
        var valid_numbers = game.discard_pile[game.discard_pile.length-1].valid_numbers
	}
	return valid_numbers
}

function validMove(game){
	var [active,place] = get_active_hand(game.players[player_id]);
	var valid_numbers = get_valid_numbers(game);
	var valid_move = false;
	var fd_valid = false;
	
	for(const card of active){
		valid_move = valid_move || valid_numbers.includes(card.number);
	}
	
	return valid_move;
}

function takeTurn() {
	console.log("Taking turn!")
	var [active, place] = get_active_hand(game_state.players[player_id]);
	var valid_numbers = get_valid_numbers(game_state);
	selected_cards  = [];
	for(const select of selection){
		selected_cards.push(get_card(game_state.players[player_id],select.index,select.place));
	}
	all_same = selected_cards.every(function(x){return x.number == selected_cards[0].number})
	if(all_same && valid_numbers.includes(selected_cards[0].number)){
		socket.emit('discard',{"selection":selection,"selected_cards":selected_cards,"place":place,"valid":true});
		selection = [];
		while (selected_space.lastElementChild) {
			selected_space.removeChild(selected_space.lastElementChild);
		}
	} else if(place == "fd"){
		socket.emit('discard',{"selection":selection,"selected_cards":selected_cards,"place":place,"valid":false});
		selection = [];
		while (selected_space.lastElementChild) {
			selected_space.removeChild(selected_space.lastElementChild);
		}
		console.log("Invalid move! Pick up discard pile.");
		socket.emit('pickup')
		socket.emit('play');
	} else {
		console.log("Invalid move!")
	}
	
}

var username = null;
while(username == null || username == '') {
	var username = prompt("What is your name?")
}
socket.emit('new_player',username);
document.getElementById("ready_button").style.display = 'none';
document.getElementById("play_button").style.display = 'none';
