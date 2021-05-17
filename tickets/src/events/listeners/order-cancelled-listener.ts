import { Listener, OrderCancelledEvent, Subjects } from '@ajktickets/common'
import { Message } from 'node-nats-streaming'
import { queueGroupName } from './queue-group-name'
import { Ticket } from '../../models/ticket'
import { TicketUpdatedPublisher } from '../publishers/tickets-updated-publisher'

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled
    queueGroupName = queueGroupName

    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        // find the ticket that the order is cancelled
        const ticket = await Ticket.findById(data.ticket.id)

        // if no ticket, throw error
        if (!ticket) {
            throw new Error('Ticket not found')
        }

        // mark the order on the ticket as being cancelled by setting its orderId property to undefined
        ticket.set({ orderId: undefined })

        // save the updated ticket
        await ticket.save()
        // listeners can publish events too
        // sends out an event to update the version number across all listeners of the TicketUpdatedPublisher
        // makes sure all listeners are always up to date on the correct version number
        await new TicketUpdatedPublisher(this.client).publish({
            id: ticket.id,
            price: ticket.price,
            title: ticket.title,
            userId: ticket.userId,
            orderId: ticket.orderId,
            version: ticket.version
        })

        // ack the message
        msg.ack()
    }
}