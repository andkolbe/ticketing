import { Message } from 'node-nats-streaming'
import { Types } from  'mongoose'
import { OrderCreatedEvent, OrderStatus } from '@ajktickets/common'
import { OrderCreatedListener } from '../order-created-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client)

    // create and save a ticket
    const ticket = Ticket.build({
        title: 'Nickelback Reunion Tour',
        price: 1,
        userId: Types.ObjectId().toHexString()
    })
    await ticket.save()

    // create a fake data event
    const data: OrderCreatedEvent['data'] = {
        id: Types.ObjectId().toHexString(), // has to be a real id, because we will use it to save a ticket to mongo
        version: 0,
        status: OrderStatus.Created,
        userId: Types.ObjectId().toHexString(),
        expiresAt: '15 min',
        ticket: {
            id: ticket.id,
            price: ticket.price
        }
    }

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg, ticket }
}

it('sets the userId of the ticket', async () => {
    const { listener, data, msg, ticket } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure a ticket was created
    const updatedTicket = await Ticket.findById(ticket.id)

    expect(updatedTicket!.orderId).toEqual(data.id)
})

it('acks the message', async () => {
    const { listener, data, msg } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure ack function is called 
    expect(msg.ack).toHaveBeenCalled()
})

it('publishes a ticket updated event', async () => {
    const { listener, data, msg } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure ack function is called 
    expect(natsWrapper.client.publish).toHaveBeenCalled()
})