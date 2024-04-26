const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler'); // Move errorHandler import here

// Middleware
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads',express.static(__dirname +'public/uploads'));
// Routes

const categoriesRoutes = require('./routers/categories'); // Corrected route name
const productRoutes = require('./routers/products');
const usersRoutes = require('./routers/users');
const ordersRoutes = require('./routers/orders');
const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes); // Corrected route name
app.use(`${api}/products`, productRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: err.message,
      errors: Object.keys(err.errors).reduce((errors, key) => {
        errors[key] = err.errors[key].message;
        return errors;
      }, {}),
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  return res.status(500).json({
    message: 'Internal Server Error',
  });
});

// Database
mongoose.connect(process.env.CONNECTION_STRING, {
    //useNewUrlParser: true,
   // useUnifiedTopology: true,
    dbName: 'eshop-db'
})
.then(() => {
    console.log('Database Connection is ready...')
})
.catch((err) => {
    console.log(err);
});

// Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
