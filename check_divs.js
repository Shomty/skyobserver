const fs = require('fs');
const content = fs.readFileSync('/src/App.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += opens - closes;
  if (balance < 0) {
    console.log(`Balance negative at line ${i + 1}: ${balance}`);
  }
}
console.log(`Final balance: ${balance}`);
