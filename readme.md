# Pictionary

This app is an exercise in Node.js and Socket.io. It contains the following features:

- A prompt for a user to enter a nickname. The first user to enter is designated as the drawer, subsequent users are guessers.

- The drawer is able to draw on the canvas and all other users can view the drawing.

- Users can submit guesses, which will be displayed on all players' screens.

- When the correct guess is made, the app will announce the name of the guesser, who will then be designated as the next drawer.

- The drawer can also designate a different drawer by double clicking their user name in the Player list.

- If the drawer disconnects, a random user on the Player list will be designated as the new drawer.

- A youtube video is included in the game to provide a basic tutorial on how to draw objects.

- A color palette allows the drawer to change the color of the pen, and the palette includes a 'clear' button to clear the canvas.