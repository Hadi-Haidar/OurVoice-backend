// hon 3am nload el .env variables bel awal
require('dotenv').config();

// hon 3am nimport el app te3itna
const app = require('./app');

// mn7added el port yalli badna l server yshtghel 3le
const PORT = process.env.PORT || 5000;

// hon mn2alla lal app ta3mel listen 3al port
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
