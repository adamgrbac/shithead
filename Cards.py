import random

class Card:
    def __init__(self, number, suit):
        self.number = number
        self.suit = suit
        self.str_dict = {11:"J",12:"Q",13:"K",14:"A"}
        
        # Add valid moves
        if self.number == 2:
            self.valid_numbers = {2,3,4,5,6,7,8,9,10,11,12,13,14}
        elif self.number == 4:
            self.valid_numbers = {2,3,4,5,6,7,8,9,10,11,12,13,14}
        elif self.number == 5:
            self.valid_numbers = {2,3,5,6,7,8,9,10,11,12,13,14}
        elif self.number == 6:
            self.valid_numbers = {2,3,6,7,8,9,10,11,12,13,14}
        elif self.number == 7:
            self.valid_numbers = {2,3,4,5,6,7}
        elif self.number == 8:
            self.valid_numbers = {2,3,7,8,9,10,11,12,13,14}
        elif self.number == 9:
            self.valid_numbers = {2,3,7,9,10,11,12,13,14}
        elif self.number == 11:
            self.valid_numbers = {2,3,10,11,12,13,14}
        elif self.number == 12:
            self.valid_numbers = {2,3,10,12,13,14}
        elif self.number == 13:
            self.valid_numbers = {2,3,10,13,14}
        elif self.number == 14:
            self.valid_numbers = {2,3,10,14}
        else:
            self.valid_numbers = {}
        
    def __str__(self):
        return "[" +str(self.str_dict.get(self.number,self.number))+self.suit+"]"
        
    def __repr__(self):
        return "[" +str(self.str_dict.get(self.number,self.number))+self.suit+"]"
        
class Deck:
    def __init__(self,num_decks=1):
        self.nums = [2,3,4,5,6,7,8,9,10,11,12,13,14]
        self.suits = ["H","C","D","S"]

        self.cards = [Card(i,j) for i in self.nums*num_decks for j in self.suits]
		
    def shuffle(self):
        random.shuffle(self.cards)
        
    def pop(self):
        return self.cards.pop()