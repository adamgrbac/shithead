var cards = require('./cards');
var shp = require('./shitheadplayer');
var sortFunction = require('./sortFunction');
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');var app = express();
var server = http.Server(app);
var io = socketIO(server);app.set('port', 5000);

app.use('/static', express.static(__dirname + '/static'));// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});// Starts the server.

app.get('/console', function(request, response) {
  response.sendFile(path.join(__dirname, 'console.html'));
});// Route to Console

app.get('/rules', function(request, response) {
  response.sendFile(path.join(__dirname, 'rules.html'));
});// Route to Console

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

// Initialise Game
var game = {}
game = {
		game_ready:false,
		start:false,
		game_over: false,
		winner: "",
		current_turn: "",
		players: {},
		discard_pile:[],
		cards_left: 0
		}
		
// Set first player
var player_ind = 0;
var direction = 1;
var playing_deck = {};
var waiting_queue = {};
		
// Handle Connections
io.on('connection', function(socket) {
	
	// Handle new players
	socket.on('new_player',function(username) {
		if(game.start){
			waiting_queue[socket.id] = username;
			socket.emit('message','Welcome ' + username+ '!');
			socket.emit('message','A game is already in progress, please wait until game restarts or come back later!');
			socket.emit('id',socket.id)
		} else {
			game.players[socket.id] = new shp.ShitheadPlayer(username);
			socket.emit('message','Welcome ' + username+'!');
			socket.emit('id',socket.id)
		}
	})
	// Handle disconnect
	socket.on('disconnect',function() {
		if(Object.keys(game.players).includes(socket.id)){
			delete(game.players[socket.id])
		} else {
			delete(waiting_queue[socket.id])
		}
	})
	socket.on('reboot',function() {
		io.sockets.emit('message',"Restarting game...")
		for(waiting_player of Object.keys(waiting_queue)){
			game.players[waiting_player] = new shp.ShitheadPlayer(waiting_queue[waiting_player]);
		}
		waiting_player = {};
		game.game_ready=false;
		game.start=false;
		game.game_over=false;
		game.winner= "";
		game.current_turn= "";
		game.discard_pile=[];
		game.cards_left=0;
		direction = 0;
		player_ind = 0;
		for(const id of Object.keys(game.players)) {
			game.players[id].hand = [];
			game.players[id].face_up = [];
			game.players[id].face_down = [];
			game.players[id].ready=false;
		}
	})
	
	socket.on('removePlayer',function(removed){
		for(const id of Object.keys(game.players)){
			if(game.players[id].name == removed){
				io.sockets.connected[id].disconnect();
			}
		}
	})
	// Handle game start - Init Game
	socket.on('init',function(){
		for(waiting_player of Object.keys(waiting_queue)){
			game.players[waiting_player] = new shp.ShitheadPlayer(waiting_queue[waiting_player]);
		}
		waiting_player = {};
		game.start = true;
		game.game_over = false;
		game.winner = "";
		game.current_turn = "";
		game.discard_pile = [];
		game.cards_left = 0;
		direction = 1;
		io.sockets.emit('message',"Game starting!")
		
		for(const id of Object.keys(game.players)) {
			game.players[id].hand = [];
			game.players[id].face_up = [];
			game.players[id].face_down = [];
			game.players[id].ready=false;
		}
		
		// Calc number of decks required
		var num_decks = 1 + Math.floor(Object.keys(game.players).length/5);
		
		// Construct deck and shuffle
		playing_deck = new cards.Deck(num_decks);
		playing_deck.shuffle();
		
		// Deal cards
		places = ['fd','fu','hand']
		for(const place of places) {
			for(j = 0; j < 3 ; j++) {
				for(const id of Object.keys(game.players)) {
					game.players[id].add_card(playing_deck.pop(),place)
				}
			}
		}
		
		io.sockets.emit('message',"Swap any face up cards with anything in your hand.")
		io.sockets.emit('message',"Click ready when done.")
	})

	socket.on('play',function(data){
		game.players[socket.id].hand.sort(sortFunction.sortFunction);
		player_ind += direction;
		player_ind += Object.keys(game.players).length;
		player_ind %= Object.keys(game.players).length;
		game.current_turn = Object.keys(game.players)[player_ind];
		game.cards_left = playing_deck.cards.length;
		io.sockets.emit('message',game.players[game.current_turn].name+"'s turn!");
	})
	socket.on('discard',function(idx){
		var offset = 0;
		var card_string = "";
		// Remove cards from hand
		for(i = 0; i < idx.selection.length ; i++) {
			if(idx.place == "fd") {
				game.discard_pile.push(game.players[socket.id].face_down.splice(idx.selection[i].index-offset,1)[0]);
			} else if (idx.place == "fu") {
				game.discard_pile.push(game.players[socket.id].face_up.splice(idx.selection[i].index-offset,1)[0]);
			} else if (idx.place == "hand") {
				game.discard_pile.push(game.players[socket.id].hand.splice(idx.selection[i].index-offset,1)[0]);
			} else {
				throw "Probs shouldn't be here..."
			}
			offset += 1
			card_string += '['+idx.selected_cards[i].number+idx.selected_cards[i].suit+']';
		}
		// Display discarded cards
		io.sockets.emit('message',game.players[game.current_turn].name+" played " + card_string);
		
		// Draw cards from deck if required
		while(game.players[socket.id].hand.length < 3 && playing_deck.cards.length > 0) {
            game.players[socket.id].hand.push(playing_deck.pop())
			game.cards_left = playing_deck.cards.length;
		}
		
		if(idx.valid){
			// Check for win condition
			if(game.players[socket.id].hand.length == 0 && game.players[socket.id].face_up.length == 0 && game.players[socket.id].face_down == 0){
			io.sockets.emit('message', "We have a winner! " + game.players[socket.id].name);
			game.game_over = true;
			game.winner = socket.id;
			}
			
			// Reverse direction if 8 played
			if(game.discard_pile[game.discard_pile.length-1].number == "8") {
				direction *= (-1)**idx.selection.length;
				if(idx.selection.length%2 == 1){
					io.sockets.emit('message', 'Reverse!');
				}
				if(Object.keys(game.players).length == 2){
					player_ind -= direction;
					socket.emit('message','Skip! Your turn again!');
				}
			}
			
			// Sort Hand
			game.players[socket.id].hand.sort(sortFunction.sortFunction);
			
			// Swap hands if 5H played
			for(const card of idx.selected_cards){
				if(card.number == "5" && card.suit == "H") {
					io.sockets.emit('message', "Swap hands!");
					var tmp_hands = [];
					for(const player of Object.keys(game.players)) {
						tmp_hands.push(game.players[player].hand.slice());
					}
					if(direction == 1){
						tmp = tmp_hands.pop();
						tmp_hands.unshift(tmp);
					} else {
						tmp = tmp_hands.shift();
						tmp_hands.push(tmp);
					}
					for(i = 0; i < Object.keys(game.players).length ; i++) {
						game.players[Object.keys(game.players)[i]].hand = tmp_hands[i].slice();
					}
				}
			}
			
			// Clear discard pile if 10 is player or 4 of a kind played
			if((game.discard_pile[game.discard_pile.length-1].number == "10") || ((game.discard_pile.length > 3) && (game.discard_pile.slice(-4,game.discard_pile.length).every(function(x){return x.number == game.discard_pile[game.discard_pile.length-1].number})))) {
				game.discard_pile = [];
				io.sockets.emit('message',"Discard pile cleared! "+game.players[game.current_turn].name+"'s turn again!")
			} else {
				player_ind += direction;
				player_ind += Object.keys(game.players).length;
				player_ind %= Object.keys(game.players).length;
				game.current_turn = Object.keys(game.players)[player_ind];
				io.sockets.emit('message',game.players[game.current_turn].name+"'s turn!")
			}
		}
	})
	socket.on('pickup',function(){
		io.sockets.emit('message',game.players[game.current_turn].name + " can't play a card and has to pick up the pile! Shithead!")
		for(const card of game.discard_pile){
			game.players[socket.id].hand.push(card);
		}
		game.discard_pile = [];
		game.players[socket.id].hand.sort(sortFunction.sortFunction);
	})
	socket.on('swapout',function(selection){
		faceups = [];
		hands = [];
		
		// Pop cards
		var ii = 0;
		var jj = 0;
		for(selected of selection){
			if(selected.place == 'hand'){
				hands.push(game.players[socket.id].pop_card(selected.index-ii, selected.place)[0]);
				ii += 1;
			} else {
				faceups.push(game.players[socket.id].pop_card(selected.index-jj, selected.place)[0]);
				jj += 1;
			}
		}
		
		// Push Faceups
		for(hand_card of hands){
			game.players[socket.id].add_card(hand_card,'fu');
		}
			
		// Push Hands
		for(fu_card of faceups){
			game.players[socket.id].add_card(fu_card,'hand');
		}
		
	})
	socket.on('ready',function(){
		game.players[socket.id].ready = true;
		io.sockets.emit('message',game.players[socket.id].name+" is ready!");
		if(Object.keys(game.players).every(function(x){return game.players[x].ready})){
			// Commence!
			io.sockets.emit('message',"Everyone is ready! Starting the game!")
			game.current_turn = Object.keys(game.players)[player_ind]
			io.sockets.emit('message',game.players[game.current_turn].name+"'s turn!")
			for(const id of Object.keys(game.players)) {
				game.players[id].hand.sort(sortFunction.sortFunction);
			}
		}
	})
	socket.on('chat',function(chat_text){
		io.sockets.emit('message',game.players[socket.id].name+": "+chat_text)
	});
});

// Emit Game State
setInterval(function() {
	if (Object.keys(game.players).length > 1){
		game.game_ready = true;
	} else {
		game.game_ready = false; 
	}
  io.sockets.emit('state', game);
  
}, 1000);