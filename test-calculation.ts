import { calculatePositions } from './src/vedic-utils';

const birthDate = new Date('1985-03-18T15:09:00Z'); // 16:09 CET is 15:09 UTC
const lat = 44.84; // Zemun
const lon = 20.40; // Zemun

const positions = calculatePositions(birthDate, lat, lon);
const moon = positions.find(p => p.name === 'Moon');

console.log('Moon Position:', moon);
