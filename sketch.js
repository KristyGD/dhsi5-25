/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates face tracking on live video through ml5.faceMesh.
 */

let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

// Face movement tracking variables
let previousFaceCenter = { x: 0, y: 0 };
let animationOffset = 0;
let isMoving = false;

// Blink detection variables
let previousLeftEyeOpen = true;
let previousRightEyeOpen = true;
let gradientShift = 0; // Shifts the entire gradient spectrum

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  colorMode(HSB, 360, 100, 100); // Use HSB color mode for rainbow effects
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);
  
  // Draw debugging info on screen
  fill(255, 255, 255); // White text
  textSize(16);
  text("Faces detected: " + faces.length, 10, 30);
  
  // Draw all the tracked face points
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    
    // Calculate face center for movement detection
    let faceCenter = calculateFaceCenter(face);
    
    // Check if face is moving
    let movementThreshold = 5; // pixels
    let distance = dist(faceCenter.x, faceCenter.y, previousFaceCenter.x, previousFaceCenter.y);
    
    if (distance > movementThreshold) {
      isMoving = true;
    } else {
      isMoving = false;
    }
    
    // Only update animation when face is moving
    if (isMoving) {
      animationOffset += 2;
    }
    
    // Update previous face center
    previousFaceCenter = faceCenter;
      // Detect eye blinks to shift gradient colors
    detectBlinks(face);
      // Calculate mouth opening for pastel/bright control
    let mouthValues = calculateMouthPastelValues(face);
    
    for (let j = 0; j < face.keypoints.length; j++) {
      let keypoint = face.keypoints[j];
      
      // Create rainbow gradient based on keypoint position and movement-based animation
      let hue = (keypoint.x + keypoint.y + animationOffset + gradientShift) % 360; // Add gradientShift for blink effects
      let saturation = mouthValues.saturation; // Use mouth-controlled saturation for pastel effect
      let brightness = mouthValues.brightness; // Use mouth-controlled brightness
      
      fill(hue, saturation, brightness);
      noStroke();
      circle(keypoint.x, keypoint.y, 5);
    }
  }
}

function calculateFaceCenter(face) {
  let sumX = 0;
  let sumY = 0;
  let numPoints = face.keypoints.length;
  
  for (let i = 0; i < numPoints; i++) {
    sumX += face.keypoints[i].x;
    sumY += face.keypoints[i].y;
  }
    return {
    x: sumX / numPoints,
    y: sumY / numPoints
  };
}

function detectBlinks(face) {
  // Get eye keypoints for blink detection - using more reliable keypoints
  let leftEyeTop = face.keypoints[159];    // Left eye top
  let leftEyeBottom = face.keypoints[145]; // Left eye bottom
  let rightEyeTop = face.keypoints[386];   // Right eye top
  let rightEyeBottom = face.keypoints[374]; // Right eye bottom
  
  // Calculate eye opening distances
  let leftEyeDistance = abs(leftEyeTop.y - leftEyeBottom.y);
  let rightEyeDistance = abs(rightEyeTop.y - rightEyeBottom.y);
  
  // Display eye distances on screen for debugging
  fill(255, 255, 255); // White text
  textSize(14);
  text("Left eye: " + leftEyeDistance.toFixed(1), 10, 60);
  text("Right eye: " + rightEyeDistance.toFixed(1), 10, 80);
  text("Gradient shift: " + gradientShift, 10, 100);
    // More sensitive threshold - typical open eye is 5-8 pixels, closed is 0-2 pixels
  let eyeOpenThreshold = 8; // Changed to 8 - blink detected when distance is 8 or less
  let leftEyeOpen = leftEyeDistance > eyeOpenThreshold;
  let rightEyeOpen = rightEyeDistance > eyeOpenThreshold;
  
  // Debug: Print eye distances to console (remove this later)
  if (frameCount % 30 === 0) { // Print every 30 frames to avoid spam
    console.log("Left eye distance:", leftEyeDistance, "Open:", leftEyeOpen);
    console.log("Right eye distance:", rightEyeDistance, "Open:", rightEyeOpen);
  }
  
  // Detect blinks (eye was open, now closed)
  if (previousLeftEyeOpen && !leftEyeOpen) {
    // Left eye blinked - shift gradient by 60 degrees
    gradientShift += 60;
    console.log("Left eye blink detected! Gradient shift:", gradientShift);
  }
  
  if (previousRightEyeOpen && !rightEyeOpen) {
    // Right eye blinked - shift gradient by 120 degrees
    gradientShift += 120;
    console.log("Right eye blink detected! Gradient shift:", gradientShift);
  }
  
  // Keep gradient shift within 0-360 range
  gradientShift = gradientShift % 360;
    // Update previous eye states
  previousLeftEyeOpen = leftEyeOpen;
  previousRightEyeOpen = rightEyeOpen;
}

function calculateMouthPastelValues(face) {
  // Get mouth keypoints
  let upperLip = face.keypoints[13];  // Upper lip center
  let lowerLip = face.keypoints[14];  // Lower lip center
  
  // Calculate mouth opening distance
  let mouthOpening = abs(lowerLip.y - upperLip.y);
  
  // Display mouth opening on screen for debugging
  fill(255, 255, 255); // White text
  textSize(14);
  text("Mouth opening: " + mouthOpening.toFixed(1), 10, 120);
  
  // Map mouth opening to create pastel effect
  // Closed mouth (0-5 pixels) = very pastel (low saturation, moderate brightness)
  // Open mouth (15+ pixels) = vibrant colors (high saturation, high brightness)
  
  // Saturation: closed mouth = pastel (20-40), open mouth = vibrant (80-100)
  let saturation = map(mouthOpening, 0, 20, 25, 85);
  saturation = constrain(saturation, 25, 85);
  
  // Brightness: closed mouth = moderate (60-70), open mouth = bright (85-95)
  let brightness = map(mouthOpening, 0, 20, 65, 90);
  brightness = constrain(brightness, 65, 90);
  
  // Display calculated values for debugging
  text("Saturation: " + saturation.toFixed(1), 10, 140);
  text("Brightness: " + brightness.toFixed(1), 10, 160);
  
  return {
    saturation: saturation,
    brightness: brightness
  };
}

// Callback function for when faceMesh outputs data
function gotFaces(results) {
  // Save the output to the faces variable
  faces = results;
}
