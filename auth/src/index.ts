import mongoose from 'mongoose';

import { app } from './app'
 
const start = async () => {
  console.log('starting up...')
  if (!process.env.JWT_KEY) { // prevents typescript error with process.env on app startup
    throw new Error('JWT must be defined')
  }

  if (!process.env.MONGO_URI) { 
    throw new Error('MONGO_URI must be defined')
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { // connect to the mongodb pod
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    console.log('Connceted to MongoDB')
  } catch (err) {
    console.error(err)
  }

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
}

start();

