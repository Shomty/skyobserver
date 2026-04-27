import { calculatePositions, predictTransits } from './src/vedic-utils.ts';

const date = new Date();
const positions = calculatePositions(date);
const predictions = predictTransits(date, positions);
console.log(predictions.length);
