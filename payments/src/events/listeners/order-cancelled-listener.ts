import { Listener, OrderCancelledEvent, OrderStatus, Subjects } from '@ajktickets/common'
import { Message } from 'node-nats-streaming'
import { queueGroupName } from './queue-group-name'
import { Order } from '../../models/order'

// if an order has a status of cancelled, the payment will be rejected
export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled
    queueGroupName = queueGroupName

    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        // find the correct order by its unique id
        const order = await Order.findOne({ 
            _id: data.id,
            version: data.version - 1
        })

        // if no order, throw error
        if (!order) {
            throw new Error('Order not found')
        }

        // update the status on the order to cancelled
        order.set({ status: OrderStatus.Cancelled })

        // save the updated order
        await order.save()

        // ack the message
        msg.ack()
    }
}