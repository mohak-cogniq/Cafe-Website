const fs = require('fs');

// Safe build script for browser deployment
const fileContent = `/* Safe environment configuration placeholder for browser runtime */
window.ENV = window.ENV || {};
`;

fs.writeFileSync('config.js', fileContent, 'utf8');
console.log('Successfully generated safe config.js placeholder for browser deployment.');
