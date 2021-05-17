import { Listener, OrderCreatedEvent, Subjects } from '@ajktickets/common'
import { Message } from 'node-nats-streaming'
import { queueGroupName } from './queue-group-name'
import { expirationQueue } from '../../queues/expiration-queue'

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    readonly subject = Subjects.OrderCreated
    queueGroupName = queueGroupName

    async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
        const delay = new Date(data.expiresAt).getTime() - new Date().getTime()

        // enqueue a job using our Bull queue
        await expirationQueue.add({
            orderId: data.id // orderId comes from the data object we are receiving on the OrderCreatedEvent
        }, {
            delay
        })

        msg.ack()
    }
}