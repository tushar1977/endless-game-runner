require('dotenv').config();
const express = require('express');

const app = express();
const player_route = require('./routes/player.route')
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    type: 'success',
    message: 'Hello World 111',
    data: null,
  });
});

app.use('*', (req, res, next) => {
  const error = {
    status: 404,
    message: API_ENDPOINT_NOT_FOUND_ERR,
  };
  next(error);
});

app.use('/api/player', player_route)

async function main() {

  server.listen(3000, () => {
    console.log('🚀 Server listening on port 3000');
  });
}

main()
