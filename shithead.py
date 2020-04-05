from Cards import Deck
import numpy as np
import os

class ShitheadPlayer:
    def __init__(self,name):
        self.name = name
        self.hand = []
        self.face_down = []
        self.face_up = []
        
    def add_card(self,card,place):
        if place == "hand":
            self.hand.append(card) 
        elif place == "fd":
            self.face_down.append(card) 
        elif place == "fu":
            self.face_up.append(card) 
        else:
            raise("Can't do that...")
            
    def display_cards(self):
        print_str = "[--]"*len(self.face_down) + "\n"
        for card in self.face_up:
            print_str += str(card)
        print_str += "\n\n"
        # Sort Hand
        sort_order = np.argsort([card.number for card in self.hand])
        self.hand = [self.hand[x] for x in sort_order]
        for card in self.hand:
            print_str += str(card)
        print(print_str)
        
    def get_active_hand(self):
        if len(self.hand) == 0:
            if len(self.face_up) == 0:
                return self.face_down, "fd"
            else:
                return self.face_up, "fu"
        else:
            return self.hand, "hand"
    
    def pop_card(self,index,place):
        if place == "hand":
            return self.hand.pop(index) 
        elif place == "fd":
            return self.face_down.pop(index) 
        elif place == "fu":
            return self.face_up.pop(index) 
        else:
            raise("Can't do that...")

game_over = False

# Get number of players
num_players = 0
players = []

print("How many players?")
while num_players < 2:
	num_players = int(input())
	if num_players == -1:
		quit()
	if num_players < 2:
		print("You need at least 2 players to play shithead! Try again...")
        
for i in range(num_players):
    print("Enter Name for Player",i+1,":")
    name = input()
    players.append(ShitheadPlayer(name))
		
num_decks = 1+num_players//3 

playing_deck = Deck(num_decks)
playing_deck.shuffle()

discard_pile = []

# Deal Cards

for place in ['fd','fu','hand']:
    for i in range(3):
        for j in range(num_players):
            players[j].add_card(playing_deck.pop(),place)
 
# Game 
player_ind = 0
direction = 1

print("Press Enter to start game...")
input()
os.system('cls')

while game_over == False:
    # Select player
    player = players[player_ind]

    print(player.name,"'s turn:")
    # Display Hand
    player.display_cards()
    # Take a turn
    active, place = player.get_active_hand()
    # Implement Game Rules
    
    # Construct valid numbers
    if len(discard_pile) == 0:
        valid_numbers = {2,3,4,5,6,7,8,9,10,11,12,13,14}
    elif discard_pile[-1].number == 3:
        if len(discard_pile) == 1:
            valid_numbers = {2,3,4,5,6,7,8,9,10,11,12,13,14}
        elif discard_pile[-2].number == 3:
            if len(discard_pile) == 2:
                valid_numbers = {2,3,4,5,6,7,8,9,10,11,12,13,14}
            elif discard_pile[-3].number ==3:
                if len(discard_pile) == 3:
                    valid_numbers = {2,3,4,5,6,7,8,9,10,11,12,13,14}
                else:
                    valid_numbers = discard_pile[-4].valid_numbers
            else:
                valid_numbers = discard_pile[-3].valid_numbers
        else:
            valid_numbers = discard_pile[-2].valid_numbers
    else:
        valid_numbers = discard_pile[-1].valid_numbers
        
    # Check for valid moves:
    valid_move = False 
    fd_valid = False
    
    for card in active:
        valid_move |= card.number in valid_numbers 
    
    # Special Play for Face Down Play
    if place == 'fd':
        print("Play which card? [",1,"-",len(active),"]")
        selection = [int(input())-1]
        if active[selection[0]].number in valid_numbers:
            valid_move = True
            fd_valid = True
        else:
            valid_move = False
    else:
        pass
    
    # Play
    if valid_move:
        if fd_valid:
            valid_move_played = True
        else:
            valid_move_played = False
        while(valid_move_played == False):
            print("Play which card? [",1,"-",len(active),"]")
            #selection = int(input())-1
            selection = [int(y)-1 for y in input().split(",")]
            if all(active[v].number == active[selection[0]].number for v in selection) and (active[selection[0]].number in valid_numbers):
                valid_move_played = True
            else:
                print("Invalid move!")
        discard = []
        selection.sort()
        for i,v in enumerate(selection):
            discard.append(player.pop_card(v-i,place))
        discard_pile.extend(discard)
        print(discard_pile)
        print("Playing",str(discard))
        print("Press Enter to end turn...")
        input()
        os.system('cls')
        if discard_pile[-1].number == 3 and len(discard_pile) > 1:
            if discard_pile[-2].number == 3 and len(discard_pile) > 2:
                if discard_pile[-3].number == 3 and len(discard_pile) > 3:
                    print("["+str(discard_pile[-4])+str(discard_pile[-3])+str(discard_pile[-2])+str(discard_pile[-1]))
                else:
                    print("["+str(discard_pile[-3])+str(discard_pile[-2])+str(discard_pile[-1]))
            else:
                print("["+str(discard_pile[-2])+str(discard_pile[-1]))
        else:
            print("["+str(discard_pile[-1]))
            
        # Draw from deck if available
        while len(player.hand) < 3 and len(playing_deck.cards) > 0:
            player.add_card(playing_deck.pop(),'hand')
        
        # Check for post-play effects
        
        # 8 Changes direction
        if discard_pile[-1].number == 8:
            direction = (-1)**(len(discard))*direction
            if len(players) == 2 and not (len(discard_pile) > 3 and all(v.number == discard_pile[-1].number for v in discard_pile[-4:])):
                player_ind -= direction
        # 5H all players swap hands in the direction of play
        elif (5,'H') in [(x.number,x.suit) for x in discard]: #discard_pile[-1].number == 5 and discard_pile[-1].suit == 'H':
            print("Swapping hands!")
            tmp = []
            for i,player in enumerate(players[::direction]):
                tmp.append(players[i-1].hand.copy())
            for i,player in enumerate(players[::direction]):
                player.hand = tmp[i].copy()
        else:
            pass
            
        # Completing a set of 4 or playing a 10 removes the discard pile from play and the player plays again
        if (len(discard_pile) > 3 and all(v.number == discard_pile[-1].number for v in discard_pile[-4:])) or (discard_pile[-1].number == 10):
            discard_pile = []
            print("Discard pile empty! Play any card...")
            player_ind -= direction
        else:
            pass
        
    else:
        if place == 'fd':
            print(str(active[selection]))
            print("Not a valid move! Pick up discard pile!")
            input()
            os.system('cls')
            print("Discard pile empty! Play any card...")
        else:
            print("No valid moves! Pick up discard pile!")
            print("Press Enter to end turn...")
            input()
            os.system('cls')
            print("Discard pile empty! Play any card...")
        # Pick up discard pile
        player.hand.extend(discard_pile)
        discard_pile = []
    
    if len(player.face_down) == 0:
        game_over == True
        winner = player.name
    else:
        pass
    player_ind += direction
    player_ind %= len(players)
    
print(winner,"is the winner!")
            