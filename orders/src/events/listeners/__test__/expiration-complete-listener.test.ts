import { Message } from 'node-nats-streaming'
import { Types } from  'mongoose'
import { ExpirationCompleteEvent, OrderStatus } from '@ajktickets/common'
import { ExpirationCompleteListener } from '../expiration-complete-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'
import { Order } from '../../../models/order'

const setup = async () => {
    // create an instance of the listener
    const listener = new ExpirationCompleteListener(natsWrapper.client)

    // create and save a ticket
    const ticket = Ticket.build({
        id: Types.ObjectId().toHexString(), // has to be a real id, because we will use it to save a ticket to mongo
        title: 'Nickelback Reunion Tour',
        price: 1
    })
    await ticket.save()

    // create and save an order
    const order = Order.build({
        status: OrderStatus.Created,
        userId: 'dontCare',
        expiresAt: new Date(),
        ticket
    })
    await order.save()

    // create a fake data event
    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id
    }

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, order, ticket, data, msg }
}

it('updates the order status to cancelled', async () => {
    const { listener, order, ticket, data, msg } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    const updatedOrder = await Order.findById(order.id)

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled)
})

it('emit an OrderCancelled event', async () => {
    const { listener, order, data, msg } = await setup()

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled()

    const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1])

    expect(eventData.id).toEqual(order.id)
})

it('acks the message', async () => {
    const { listener, data, msg } = await setup()

    await listener.onMessage(data, msg)

    expect(msg.ack).toHaveBeenCalled()
})