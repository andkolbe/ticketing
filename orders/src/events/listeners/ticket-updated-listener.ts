import { Message } from 'node-nats-streaming'
import { Listener, Subjects, TicketUpdatedEvent } from '@ajktickets/common'
import { Ticket } from '../../models/ticket'
import { queueGroupName} from './queue-group-name'

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
    readonly subject = Subjects.TicketUpdated
    queueGroupName = queueGroupName 

    async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
      
        const ticket = await Ticket.findByEvent(data) // we wrote findByEvent in our ticket model

        if (!ticket) {
            throw new Error('Ticket not found')
        }

        const { title, price } = data
        ticket.set({ title, price })
        await ticket.save()

        msg.ack() // acknowledge to the tickets service that the orders service has processed the published Ticket Updated event
    }
}