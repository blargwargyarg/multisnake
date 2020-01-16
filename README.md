multisnake
Functional game of snake in which there is one food and multiple (currently supported up to 8) players. This game is modeled after the game found on felix.neocities.org.

General logic: 
players are in control of a snake(color coded for identifiability)
playable area is limited in size
if the player 'head' collides with their own body or another players body or the borders of the playable area their snake will be unplayable and will disappear
1 food will be available at all times. This food is a unique color for identifiablity. Food causes player length to grow
if two players collide at their heads at the same time, whoever is larger will survive
Winstate is to be the last surviving snake
