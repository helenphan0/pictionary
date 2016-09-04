# Pictionary

This app is an exercise in Node.js and Socket.io. It contains the following features:

- A prompt for a user to enter a nickname. The first user to enter is designated as the drawer, subsequent users are guesser.

- The drawer is able to draw on the canvas and all other users can view the drawing.

- Users can submit guesses, which will be compared to the drawer's word.

- When the correct guess is made, the app will announce the name of the guesser, who will be designated as the next drawer.

- The drawer can also designate the different drawer by double clicking their user name in the Player list.

- If the drawer disconnects, a random user on the Player list will be designated as the drawer.

- A youtube video is included in the game to help users learn how to draw objects by understanding shapes.