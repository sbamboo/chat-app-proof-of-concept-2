// start-dev.js
import { spawn } from 'child_process';

// Function to handle the convex process
const startConvex = () => {
  const convex = spawn('npx', ['convex', 'dev'], { stdio: 'inherit' });

  console.log('Starting convex dev...');

  // Listen for convex dev process to exit or be killed
  convex.on('exit', (code) => {
    console.log(`Convex dev process ended with code ${code}. Starting Vite...`);
    startVite();
  });

  // Handle errors if convex fails to start or throws an error
  convex.on('error', (err) => {
    console.error('Error with Convex dev process:', err.message);
    startVite();  // If there's an error, still try to run vite
  });

  // Handle the termination of convex by catching signals
  process.on('SIGINT', () => {
    console.log('Received SIGINT, but continuing to start Vite...');
    convex.kill('SIGINT');  // Pass SIGINT to convex to stop it gracefully
  });
};

// Function to handle the vite process
const startVite = () => {
  const vite = spawn('npx', ['vite'], { stdio: 'inherit' });

  vite.on('exit', (viteCode) => {
    console.log(`Vite exited with code ${viteCode}`);
  });
};

// Start the convex dev process
startConvex();
