#!/bin/bash

# Array of directories
directories=("matching-service" "peer-prep" "question-service" "user-service")

# Loop through each directory and run npm run dev
for dir in "${directories[@]}"; do
  echo "Navigating to $dir"
  cd "$dir" || { echo "Failed to enter $dir"; exit 1; }
  
  echo "Running npm run dev in $dir"
  npm run dev &  # Run in the background so the script can continue
  
  # Go back to the root directory
  cd - >/dev/null || { echo "Failed to return to root"; exit 1; }
done

echo "All services started."
