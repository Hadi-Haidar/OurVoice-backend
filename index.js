const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Your Express Server is running! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
