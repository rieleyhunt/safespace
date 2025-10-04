
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get('/button-clicked', (req, res) => {
    res.json({message: 'button was clicked!'})
    console.log('Button click received');
});
 
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});