import { Message } from 'node-nats-streaming'
import { Types } from  'mongoose'
import { TicketUpdatedEvent } from '@ajktickets/common'
import { TicketUpdatedListener } from '../ticket-updated-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'

const setup = async () => {
    // create an instance of the listener
    const listener = new TicketUpdatedListener(natsWrapper.client)

    // create and save a ticket
    const ticket = Ticket.build({
        id: Types.ObjectId().toHexString(), // has to be a real id, because we will use it to save a ticket to mongo
        title: 'Nickelback Reunion Tour',
        price: 1
    })
    await ticket.save()

    // create a fake data event
    const data: TicketUpdatedEvent['data'] = {
        version: ticket.version + 1,
        id: ticket.id, 
        title: 'Nickelback Reunion Tour',
        price: 0.5,
        userId: Types.ObjectId().toHexString()
    }

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg, ticket }
}

it('finds, updates, and saves a ticket', async () => {
    const { listener, data, msg, ticket } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure a ticket was created
    const updatedTicket = await Ticket.findById(ticket.id)

    expect(updatedTicket!.version).toEqual(data.version)
    expect(updatedTicket!.title).toEqual(data.title)
    expect(updatedTicket!.price).toEqual(data.price)
})

it('acks the message', async () => {
    const { listener, data, msg } = await setup()

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg)

    // write assertions to make sure ack function is called 
    expect(msg.ack).toHaveBeenCalled()
})

it('does not call ack if the event has a skipped version number', async () => {
    const { listener, data, msg } = await setup()

    data.version = 10

    // call the onMessage function with the data object + message object
    try {
        await listener.onMessage(data, msg)
    } catch (err) {
        
    }

    // write assertions to make sure ack function is not called 
    expect(msg.ack).not.toHaveBeenCalled()
})