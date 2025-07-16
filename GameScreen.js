import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const GameScreen = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const PLAYER_SIZE = 80;
  const OBJECT_SIZE = 50; // Adjusted size for better proportions
  const SPAWN_INTERVAL = 1000; // ms
  const FALL_SPEED_MIN = 2;
  const FALL_SPEED_MAX = 6;
  
  // Game state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [fallingObjects, setFallingObjects] = useState([]);
  const [level, setLevel] = useState(1);
  const gameLoopRef = useRef(null);
  const spawnTimerRef = useRef(null);
  
  // Player position
  const playerX = useSharedValue(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2);
  const playerY = useSharedValue(SCREEN_HEIGHT - PLAYER_SIZE - 50);
  
  // Simple direct touch handler for moving the starship
  const moveStarship = (x) => {
    // Ensure the starship stays within screen boundaries
    const newX = Math.max(0, Math.min(SCREEN_WIDTH - PLAYER_SIZE, x - PLAYER_SIZE / 2));
    playerX.value = newX;
  };

  // Touch handlers for player movement
  const [touchStartX, setTouchStartX] = useState(0);
  
  // Handle touch events directly instead of using gestures
  const handleTouchStart = (event) => {
    const x = event.nativeEvent.pageX;
    setTouchStartX(x);
    moveStarship(x);
  };
  
  const handleTouchMove = (event) => {
    const x = event.nativeEvent.pageX;
    moveStarship(x);
  };
  
  const handleTouchEnd = (event) => {
    // Optional: Add any touch end logic here
  };

  // Generate a new falling object
  const generateObject = () => {
    const isGem = Math.random() > 0.7; // 30% chance for gems, 70% for asteroids
    const objectType = isGem ? 'gem' : 'asteroid';
    
    // Object creation
    
    const newObject = {
      id: Date.now() + Math.random(),
      x: Math.random() * (SCREEN_WIDTH - OBJECT_SIZE),
      y: -OBJECT_SIZE,
      speed: FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN) * (level * 0.2),
      type: objectType,
      width: OBJECT_SIZE,
      height: OBJECT_SIZE,
    };
    return newObject;
  };

  // Check collision between player and object
  const checkCollision = (object) => {
    const playerLeft = playerX.value;
    const playerRight = playerX.value + PLAYER_SIZE;
    const playerTop = playerY.value;
    const playerBottom = playerY.value + PLAYER_SIZE;
    
    const objectLeft = object.x;
    const objectRight = object.x + object.width;
    const objectTop = object.y;
    const objectBottom = object.y + object.height;
    
    return (
      playerLeft < objectRight &&
      playerRight > objectLeft &&
      playerTop < objectBottom &&
      playerBottom > objectTop
    );
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    // Start spawning objects
    spawnTimerRef.current = setInterval(() => {
      const newObject = generateObject();
      // Add new object to game
      setFallingObjects(prev => [...prev, newObject]);
    }, SPAWN_INTERVAL - (level * 50)); // Spawn faster as level increases
    
    // Main game loop
    gameLoopRef.current = setInterval(() => {
      setFallingObjects(prevObjects => {
        // Move objects down and check for collisions
        const updatedObjects = prevObjects.map(obj => {
          const updatedObj = { ...obj, y: obj.y + obj.speed };
          
          // Check if object is out of screen
          if (updatedObj.y > SCREEN_HEIGHT) {
            return null; // Remove object
          }
          
          // Check collision with player
          if (checkCollision(updatedObj)) {
            if (updatedObj.type === 'gem') {
              // Collect gem
              setScore(prev => {
                const newScore = prev + 10;
                // Level up every 100 points
                if (newScore % 100 === 0) {
                  setLevel(prevLevel => prevLevel + 1);
                }
                return newScore;
              });
              return null; // Remove collected gem
            } else {
              // Hit by asteroid
              setGameOver(true);
            }
          }
          
          return updatedObj;
        }).filter(Boolean); // Remove null objects
        
        return updatedObjects;
      });
    }, 16); // ~60fps
    
    return () => {
      // Cleanup
      clearInterval(gameLoopRef.current);
      clearInterval(spawnTimerRef.current);
    };
  }, [gameStarted, gameOver, level]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
    setFallingObjects([]);
    playerX.value = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
    playerY.value = SCREEN_HEIGHT - PLAYER_SIZE - 50;
  };

  const playerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: playerX.value,
    top: playerY.value,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    zIndex: 20, // Higher than touchArea to ensure visibility
  }));

  return (
    <View style={styles.container}>
      <Image 
        source={require('./assets/images/nebula.jpg')} 
        style={styles.backgroundImage}
      />
      {!gameStarted ? (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.score}>Score: {score}</Text>
            <Text style={styles.level}>Level: {level}</Text>
          </View>

          {/* Render falling objects */}
          {fallingObjects.map(object => (
            <Animated.View 
              key={object.id}
              style={[styles.fallingObject, { 
                left: object.x, 
                top: object.y,
                width: object.width,
                height: object.height,
              }]}
            >
              {object.type === 'gem' && (
                <Image 
                  source={require('./assets/images/gem.jpg')} 
                  style={styles.objectImage}
                  resizeMode="contain"
                />
              )}
              {object.type === 'asteroid' && (
                <View style={styles.asteroidFallback}>
                  <View style={styles.asteroidOuter}>
                    <View style={styles.asteroidInner}>
                      <Text style={styles.asteroidText}>☄️</Text>
                    </View>
                  </View>
                </View>
              )}
              {/* No debug text */}
            </Animated.View>
          ))}

          {/* Touch area for player control */}
          <View 
            style={styles.touchArea}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            pointerEvents="box-none"
          >
            {/* Player ship */}
            <Animated.View style={playerStyle}>
              <Image 
                source={require('./assets/images/starship.png')} 
                style={styles.player}
              />
            </Animated.View>
          </View>
          
          {gameOver && (
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOverText}>Game Over!</Text>
              <Text style={styles.scoreText}>Final Score: {score}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={startGame}>
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    zIndex: 5,
  },
  player: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  score: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  level: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fallingObject: {
    position: 'absolute',
    zIndex: 15, // Increased z-index to be above background but below player
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  // Debug text removed
  asteroidText: {
    fontSize: 40, // Large emoji
    lineHeight: 40,
  },
  asteroidFallback: {
    width: '60%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  asteroidOuter: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(254, 254, 254, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  asteroidInner: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4a148c',
    padding: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: '50%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  touchArea: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10,
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  gameOverText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreText: {
    color: '#fff',
    fontSize: 32,
    marginBottom: 40,
  },
  restartButton: {
    backgroundColor: '#4a148c',
    padding: 20,
    borderRadius: 10,
  },
});

export default GameScreen;