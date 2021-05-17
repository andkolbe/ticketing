import mongoose from 'mongoose';
import { app } from './app'
import { natsWrapper } from './nats-wrapper'
import { ExpirationCompleteListener} from './events/listeners/expiration-complete-listener'
import { TicketCreatedListener } from './events/listeners/ticket-created-listener'
import { TicketUpdatedListener } from './events/listeners/ticket-updated-listener'
import { PaymentCreatedListener } from './events/listeners/payment-created-listener'

const start = async () => {
  console.log('Starting...')
  if (!process.env.JWT_KEY) { // prevents typescript error with process.env on app startup
    throw new Error('JWT must be defined')
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined')
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID must be defined')
  }

  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined')
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID must be defined')
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL,
      process.env.NATS_CLUSTER_ID
    )
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed')
      process.exit()
    })

    // runs anytime our listener closes or restarts. Doesn't always work on windows
    process.on('SIGINT', () => natsWrapper.client.close()) // interrupt
    process.on('SIGTERM', () => natsWrapper.client.close()) // terminate

    new ExpirationCompleteListener(natsWrapper.client).listen()
    new TicketCreatedListener(natsWrapper.client).listen()
    new TicketUpdatedListener(natsWrapper.client).listen()
    new PaymentCreatedListener(natsWrapper.client).listen()

    await mongoose.connect(process.env.MONGO_URI, { // connect to the mongodb pod
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error(err)
  }

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
}

start();

