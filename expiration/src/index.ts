import { natsWrapper } from './nats-wrapper'
import { OrderCreatedListener } from './events/listeners/order-created-listener'

const start = async () => {

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

    new OrderCreatedListener(natsWrapper.client).listen()

  } catch (err) {
    console.log(err)
  }
}

start();

