import { Message } from 'node-nats-streaming'
import { Listener, Subjects, ExpirationCompleteEvent, OrderStatus } from '@ajktickets/common'
import { queueGroupName} from './queue-group-name'
import { Order } from '../../models/order'
import { OrderCancelledPublisher } from '../publishers/order-cancelled-publisher'

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
    readonly subject =  Subjects.ExpirationComplete
    queueGroupName = queueGroupName 

    async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
        const order = await Order.findById(data.orderId).populate('ticket')

        if (!order) {
            throw new Error('Order not found')
        }

        // don't cancel an order that has already been paid for
        if (order.status === OrderStatus.Complete) {
            return msg.ack()
        }

        order.set({ // the ticket property is already reset on out isReserved method. We don't have to worry about the ticket property on the order here
            status: OrderStatus.Cancelled
        })

        await order.save() // save the updated status in the db

        // publish an event letting everyone know the order has been cancelled
        await new OrderCancelledPublisher(this.client).publish({ // wait for this to be completed before sending the acknowledge message
            id: order.id,
            version: order.version,
            ticket: {
                id: order.ticket.id
            }
        })

        msg.ack() // acknowledge to the tickets service that the orders service has processed the published Ticket Created event
    }
}