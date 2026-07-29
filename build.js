const fs = require('fs');

// Read GEMINI_API_KEY from environment variable
const apiKey = process.env.GEMINI_API_KEY || '';
const grokKey = process.env.GROK_API_KEY || '';

const fileContent = `/* Auto-generated environment configuration for browser runtime */
window.ENV = window.ENV || {
  GEMINI_API_KEY: "${apiKey}",
  GROK_API_KEY: "${grokKey}"
};
`;

fs.writeFileSync('config.js', fileContent, 'utf8');
console.log('Successfully generated config.js for browser deployment.');
