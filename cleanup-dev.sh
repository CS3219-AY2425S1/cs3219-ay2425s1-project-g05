#!/bin/bash

# List of ports to clean up
ports=(5173 8000 8001 8002 8003 8004)

# Loop through each port and clean it up
for port in "${ports[@]}"; do
  echo "Cleaning up port $port..."
  
  # Check if the port is in use and kill the processes using it
  fuser -n tcp -k "$port" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "Port $port cleaned successfully."
  else
    echo "No processes found on port $port, or failed to clean up."
  fi
done

echo "Service cleanup complete."
