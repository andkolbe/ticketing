import { Message } from 'node-nats-streaming'
import { Types } from  'mongoose'
import { OrderCancelledEvent, OrderStatus } from '@ajktickets/common'
import { OrderCancelledListener } from '../order-cancelled-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client)

    // create and save a ticket
    const orderId = Types.ObjectId().toHexString()
    const ticket = Ticket.build({
        title: 'Nickelback Reunion Tour',
        price: 1,
        userId: Types.ObjectId().toHexString()
    })
    ticket.set({ orderId })
    await ticket.save()

    // create a fake data event
    const data: OrderCancelledEvent['data'] = {
        id: orderId,
        version: 0,
        ticket: {
            id: ticket.id
        }
    }

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg, ticket, orderId }
}

it('updates the ticket, publishes an event, and acks the message', async () => {
    const { listener, data, msg, ticket, orderId } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    const updatedTicket = await Ticket.findById(ticket.id)
    expect(updatedTicket!.orderId).not.toBeDefined() 
    expect(msg.ack).toHaveBeenCalled()
    expect(natsWrapper.client.publish).toHaveBeenCalled()
})
