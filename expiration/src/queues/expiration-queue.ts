import Queue from 'bull'
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher'
import { natsWrapper } from '../nats-wrapper'

interface Payload { // data we are going to store inside of the job object. Typescript help
    orderId: string
}

// create an instance of a queue. It allows us to publish a job to our Redis server and process a completed job that comes back
const expirationQueue = new Queue<Payload>('order:expiration', {
    redis: {
        host: process.env.REDIS_HOST // the redis host on our yaml file
    }
})

// process the job that comes back from Redis and send out an expiration:complete event
expirationQueue.process(async (job) => {
    new ExpirationCompletePublisher(natsWrapper.client).publish({
        orderId: job.data.orderId
    })
})

export { expirationQueue }