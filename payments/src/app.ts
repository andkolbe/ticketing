import express from 'express';
import 'express-async-errors'; // prevents you from having to write next() in all async function errors
import cookieSession from 'cookie-session';
import { currentUser, errorHandler, NotFoundError } from '@ajktickets/common';
import { createChargeRouter } from './routes/new'

const app = express();
app.set('trust proxy', true) // tell express to trust our nginx proxy
app.use(express.json());
app.use(
  cookieSession({
    // disable encryption on our cookie. JWTs are already encrypted. 
    // Makes it easier to use different languages between our services. We don't have to worry about any language not understanding our encryption
    signed: false,
    // secure: true // requires that we must be on a https connection
    secure: process.env.NODE_ENV !== 'test' // make this change to make sure auth works in our tests
  })
)
app.use(currentUser) // run this after the req.session is set

app.use(createChargeRouter)

app.all('*', async () => { // throw an error if someone tries to go to any route not specified
  throw new NotFoundError()
})

app.use(errorHandler)

export { app }