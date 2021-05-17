import { Message } from 'node-nats-streaming'
import { Types } from 'mongoose'
import { OrderCancelledEvent, OrderStatus } from '@ajktickets/common'
import { OrderCancelledListener } from '../order-cancelled-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Order } from '../../../models/order'

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client)

    // create and save an order
    const order = Order.build({
        id: Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        price: 1,
        userId: Types.ObjectId().toHexString(),
        version: 0
    })
    await order.save()

    // create a fake data event
    const data: OrderCancelledEvent['data'] = {
        id: order.id,
        version: 1,
        ticket: {
            id: 'id'   
        }
    }

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg, order }
}

it('updates the status of the order', async () => {
    const { listener, data, msg, order } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure a ticket was created
    const updatedOrder = await Order.findById(order.id)

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled)
})

it('acks the message', async () => {
    const { listener, data, msg, order } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure ack function is called 
    expect(msg.ack).toHaveBeenCalled()
})