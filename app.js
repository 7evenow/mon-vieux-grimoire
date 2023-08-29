const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');
const rateLimit = require("express-rate-limit");
const helmet = require("helmet")
require('dotenv').config();


mongoose.connect(process.env.MONGO_URL,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  helmet()
  rateLimit({
    windowMs: 60 * 1000, // période d'une minute
    max: 60, // nombre de requêtes qu'un utilisateur peut faire dans la période définie
    message: "Vous avez atteint la limite de 100 requêtes par minutes !", //message que l'utilisateur reçoit lorsque la limite est atteinte
    headers: true,//indique qu'il faut ajouter le nombre de requêtes totales,  
  })
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE,OPTIONS');
  next();
});

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname,'images')));
module.exports = app;