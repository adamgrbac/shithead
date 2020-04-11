class Card {
	constructor(number,suit){
		this.number = number;
		this.suit = suit;
		
		// Add valid moves
		switch(this.number) {
			case "2":
				this.valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","ACE"];
				break;
			case "4":
				this.valid_numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","ACE"];
				break;
			case "5":
				this.valid_numbers = ["2","3","5","6","7","8","9","10","J","Q","K","ACE"];
				break;
			case "6":
				this.valid_numbers = ["2","3","6","7","8","9","10","J","Q","K","ACE"];
				break;
			case "7":
				this.valid_numbers = ["2","3","4","5","6","7"];
				break;
			case "8":
				this.valid_numbers = ["2","3","7","8","9","10","J","Q","K","ACE"];
				break;
			case "9":
				this.valid_numbers = ["2","3","7","9","10","J","Q","K","ACE"];
				break;
			case "J":
				this.valid_numbers = ["2","3","10","J","Q","K","ACE"];
				break;
			case "Q":
				this.valid_numbers = ["2","3","10","Q","K","ACE"];
				break;
			case "K":
				this.valid_numbers = ["2","3","10","K","ACE"];
				break;
			case "ACE":
				this.valid_numbers = ["2","3","10","ACE"];
				break;
			default:
				this.valid_numbers = []
		}
	}
	
	str() {
		return '['+this.number+this.suit+']'
	}
}

function Deck (num_decks) {
	this.numbers = ["2","3","4","5","6","7","8","9","10","J","Q","K","ACE"];
	this.suits = ["H","C","D","S"]
	this.cards = []
	
	for(var i = 0; i < this.numbers.length; i++){
		for(var j = 0; j < this.suits.length; j++){
			this.cards.push(new Card(this.numbers[i],this.suits[j]))
		}
	}
	
	this.shuffle = function() {
		function shuffle(a) {
			for (let i = a.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[a[i], a[j]] = [a[j], a[i]];
			}
			return a;
		}
			this.cards = shuffle(this.cards)
	}
	
	this.pop = function() {
		return this.cards.pop()
	}
}

module.exports = {
  Card: Card,
  Deck: Deck
};