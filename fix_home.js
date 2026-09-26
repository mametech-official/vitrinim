const fs = require('fs');
let app = fs.readFileSync('assets/js/app.js', 'utf8');

const fixGoHome = `function goHome(){
  location.reload(); 
}
`;

app = app.replace(/function goHome\(\)\{[\s\S]*?\}\n/, fixGoHome);
fs.writeFileSync('assets/js/app.js', app, 'utf8');
