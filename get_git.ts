import { execSync } from 'child_process';
console.log(execSync('git show HEAD:src/App.tsx').toString());
