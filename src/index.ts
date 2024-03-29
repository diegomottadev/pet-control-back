import express, { Express } from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import logger from './api/resources/utils/logger';
import authJTW from './api/libs/auth';
import config from './api/config';
import passport from 'passport';
import { procesarErrores, erroresEnProduccion, erroresEnDesarrollo, procesarErroresDeTamañoDeBody } from './api/libs/errorHandler';
import { connectionDB } from "./connection/connection"

import cors from 'cors';
import { initializeDatabase } from './helpers/initializeDatabase';

const app: Express = express(); // Create an instance of the Express application

app.use(cors()); // Enable Cross-Origin Resource Sharing

app.use(
  morgan('short', {
    stream: {
      write: (message) => logger.info(message.trim()) // Configure Morgan to log HTTP requests using the 'short' format and send log messages to the logger
    }
  })
);

passport.use(authJTW); // Configure Passport to use the authJTW strategy for authentication

app.use(bodyParser.json()); // Parse incoming request bodies in JSON format and make the data available on req.body
app.use(bodyParser.raw({type:'image/*', limit:'1mb'})) // ¨Procesing content  type of image
app.use(passport.initialize()); // Initialize Passport middleware

// Connect to the database
connectionDB().then((databaseExists: boolean) => {
  // Only run the initialization script if the database exists
  if (databaseExists) {
    initializeDatabase();
  } else {
    console.log('Database does not exist. Skipping initialization script.');
  }
});

app.use(procesarErrores); // Custom error handling middleware
app.use(procesarErroresDeTamañoDeBody); // Custom error handling middleware

if (config.ambiente === 'prod') {
  app.use(erroresEnProduccion); // Error handling middleware for production environment
} else {
  app.use(erroresEnDesarrollo); // Error handling middleware for development environment
}

//const server = app.listen(3000, () => console.log('Server listening on port 3000'));
const server = app.listen(3000);

export { app, server };
