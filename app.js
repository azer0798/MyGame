const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('age-calculator');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Calculator running on port ${PORT}`));
