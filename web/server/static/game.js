var socket = io();
var canvas = document.getElementById('canvas');

canvas.width = 800;
canvas.height = 500;
var context = canvas.getContext('2d');
var fd_space = document.getElementById('fd_space')
var fu_space = document.getElementById('fu_space')
var hand_space = document.getElementById('hand_space')
var sidebar = document.getElementById('sidebar');
var game_log = document.getElementById('game-log')
var selected_space = document.getElementById('selected-space');
var buttonX = 300;
var buttonY = 280;
var buttonW = 200;
var buttonH = 40;
var button_enabled = true;

var player_id = "DEFAULT";
var in_turn = false;
var game_over = false;
var move_ready = false;
var game_state = {};
var selection = [];

socket.on('id', function(player) {
	player_id = player;
	console.log("Ok we know our id is: "+player_id)
});
socket.on('message', function(data) {
	var message = document.createElement("P");
	message.innerText = data;
	game_log.insertAdjacentElement('afterend',message);
	//sidebar.appendChild(message);
});
socket.on('state',function(game) {
	game_state = game;
	players = game.players;
	game_ready = game.game_ready;
	
	context.clearRect(0,0,800,500);
	
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
			if(button_enabled){
				context.fillStyle = 'blue';
			} else {
				context.fillStyle = 'gray';
			}
			context.fillRect(buttonX,buttonY,buttonW,buttonH)
			context.stroke()
			context.strokeText("Click to start game!",310,305)
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
				socket.emit('start');
				button_enabled = false;
			  }
			})
		}
	} else {		
		// Check if it's your turn
		if(game.game_over){ 
			context.font = '20px Arial';
			context.strokeText("Game over! Winner is "+game.players[game.winner].name,310,210)
			var [active,place] = get_active_hand(game.players[player_id]);
			var valid_numbers = get_valid_numbers(game);
			displayCards(game,active,place,valid_numbers);
			button_enabled = true;
			context.fillStyle = 'blue';
			context.fillRect(buttonX,buttonY,buttonW,buttonH)
			context.stroke()
			context.strokeText("Click to start game!",310,305)
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
				socket.emit('start');
				button_enabled = false;
			  }
			})
		} else {
			var [active,place] = get_active_hand(game.players[player_id]);
			var valid_numbers = get_valid_numbers(game);
			displayCards(game,active,place,valid_numbers);
			if(game.current_turn == player_id) {
				document.getElementById("play_button").disabled = false;
				valid_move = validMove(game);
				if(!valid_move && place != 'fd'){
					socket.emit('pickup')
					socket.emit('play');
				} 
			} else {
				document.getElementById("play_button").disabled = true;
			}
		}
	}
	
});

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

function toggleSelection(){
	var idx = this.getAttribute('index')
	if(selection.includes(idx)){
		selection.splice(selection.findIndex(function(x){return x==idx}),1);
		//selected_space.removeChild(this);
	} else {
		selection.push(idx);
		//selected_space.appendChild(this);
	}
	selection.sort(function(a,b){return parseInt(a) - parseInt(b)});
}

function displayCards(game,active,place,valid_numbers) {
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
		div.innerText = '[XX]';
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
		div.innerText = '['+card.number+card.suit+']'
		div.setAttribute('id','fu_'+ii);
		div.setAttribute('place','fu');
		div.setAttribute('index',ii);
		div.setAttribute('number',card.number);
		div.setAttribute('suit',card.suit);
		if(place == 'fu' && valid_numbers.includes(card.number)) {
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
		div.innerText = '['+card.number+card.suit+']'
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
		var div = document.createElement('div')
		console.log(place);
		if(place == 'fd') {
			div.innerText = '[XX]';
		} else {
			div.innerText = '['+active[parseInt(idx)].number+active[parseInt(idx)].suit+']';
		}
		div.setAttribute('id','select_'+ii);
		div.setAttribute('place','select');
		div.setAttribute('index',idx);
		div.setAttribute('number',active[parseInt(idx)].number);
		div.setAttribute('suit',active[parseInt(idx)].suit);
		div.addEventListener('click',toggleSelection);
		selected_space.appendChild(div);
		ii += 1;
	}
		
	context.font = '20px Arial';
	// Display discard_pile
	if(game.discard_pile.length > 0){
		if(game.discard_pile[game.discard_pile.length -1].number == 3 && game.discard_pile.length > 1){
			if(game.discard_pile[game.discard_pile.length -2].number == 3 && game.discard_pile.length > 2){
				if(game.discard_pile[game.discard_pile.length -3].number == 3 && game.discard_pile.length > 3){
					// Visualise top 4 cards
					var discard_text = '['
					for(const card of game.discard_pile.slice(-4,game.discard_pile.length)){
						discard_text += '['+card.number+card.suit
					}
					discard_text += ']'
					context.strokeText(discard_text,400,250)
				} else {
					// Visualise top three cards
					var discard_text = '['
					for(const card of game.discard_pile.slice(-3,game.discard_pile.length)){
						discard_text += '['+card.number+card.suit
					}
					discard_text += ']'
					context.strokeText(discard_text,400,250)
				}
			} else {
				// Visualise top two cards
				var discard_text = '['
					for(const card of game.discard_pile.slice(-2,game.discard_pile.length)){
						discard_text += '['+card.number+card.suit
					}
					discard_text += ']'
				context.strokeText(discard_text,400,250)
			}
		} else {
			// Visualise Top Card
			context.strokeText('['+game.discard_pile[game.discard_pile.length-1].number+game.discard_pile[game.discard_pile.length-1].suit+']',400,250)
		}
	} else {
		// Visualise Empty Discard
		context.strokeText("[  ]",400,250)
	}
}

function get_valid_numbers(game){
	
	// Construct valid numbers
    if(game.discard_pile.length == 0){
        var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
	} else if(game.discard_pile[game.discard_pile.length-1].number == 3) {
        if(game.discard_pile.length == 1){
            var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
        } else if(game.discard_pile[game.discard_pile.length-2].number == 3){
            if(game.discard_pile.length == 2){
                var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
            } else if(game.discard_pile[game.discard_pile.length-3].number ==3){
                if(game.discard_pile.length == 3){
                    var valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
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
		selected_cards.push(active[select]);
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
console.log(username)
socket.emit('new_player',username);
