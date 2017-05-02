# Asteroids Learning ([Demo](https://vcasagrande.github.io/AsteroidsLearning/))

Program that learns to avoid Asteroids by machine learning. The operation is almost the same as [Flappy Learning](https://github.com/xviniette/FlappyLearning) with 16 sensors of distance all around the ship.

![alt tag](https://github.com/xviniette/AsteroidsLearning/blob/gh-pages/img/asteroidlearning.png?raw=true)

## In This Fork
- Performance optimizations on Neuroevolution.js (Typed Arrays, loop optimizations, reduced variable declarations, etc.)
- Changed population from 50 to 200
- "Wall" distance sensor fixed
- localStorage save (between 10 generations)
- Added an array per ship to serve as "memory" and a way to the output manipulate this (and worked well)
- Save best score network as "hero"
- Trained network sample included

### Extra
- [Network Viewer](https://vcasagrande.github.io/AsteroidsLearning/viewer.html)
- [Interactive Mode](https://vcasagrande.github.io/AsteroidsLearning/test.html)

### Notes
- Tested with Google Chrome and Mozilla Firefox
