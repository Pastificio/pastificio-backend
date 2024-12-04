const path = require('path');
const fs = require('fs');

console.log('Config.js is being executed');

const envPath = path.resolve(__dirname, '.env');
console.log('Tentativo di caricare il file .env da:', envPath);

let config = {
  MONGODB_URI: 'mongodb://localhost:27017/pastificio', // Default value
  PORT: 5000,
};

if (fs.existsSync(envPath)) {
  console.log('.env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Contenuto del file .env:', envContent);

  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });
} else {
  console.log('.env file does not exist');
}

console.log('Config:', config);

module.exports = config;
