import { Message } from 'node-nats-streaming'
import { Types } from 'mongoose'
import { OrderCreatedEvent, OrderStatus } from '@ajktickets/common'
import { OrderCreatedListener } from '../order-created-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Order } from '../../../models/order'

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client)

    // create a fake data event
    const data: OrderCreatedEvent['data'] = {
        id: Types.ObjectId().toHexString(), // has to be a real id, because we will use it to save a ticket to mongo
        version: 0,
        status: OrderStatus.Created,
        userId: Types.ObjectId().toHexString(),
        expiresAt: '15 min',
        ticket: {
            id: 'id',
            price: 10
        }
    }

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg }
}

it('replicates the order info', async () => {
    const { listener, data, msg } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure a ticket was created
    const order = await Order.findById(data.id)

    expect(order!.price).toEqual(data.ticket.price)
})

it('acks the message', async () => {
    const { listener, data, msg } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure ack function is called 
    expect(msg.ack).toHaveBeenCalled()
})
