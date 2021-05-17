import { Message } from 'node-nats-streaming'
import { Listener, Subjects, TicketCreatedEvent } from '@ajktickets/common'
import { Ticket } from '../../models/ticket'
import { queueGroupName} from './queue-group-name'

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    readonly subject =  Subjects.TicketCreated
    queueGroupName = queueGroupName 

    async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
        // save the ticket data inside of orders so when the orders service needs to know some details about a ticket, 
        // it does not have to do synchronous communication with the tickets service every time. data replication
        const { id, title, price} = data // orders only really cares about the title and price of a ticket
        const ticket = Ticket.build({ id, title, price }) 
        await ticket.save()

        msg.ack() // acknowledge to the tickets service that the orders service has processed the published Ticket Created event
    }
}