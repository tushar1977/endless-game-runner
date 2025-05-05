require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const player_route = require('./routes/player.route');

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    type: 'success',
    message: 'Hello World 111',
    data: null,
  });
});
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use('/api/player', player_route);

async function main() {
  app.listen(4000, () => {
    console.log('🚀 Server listening on port 4000');
  });
}

main();
