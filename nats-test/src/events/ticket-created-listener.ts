import { Listener } from './base-listener'
import { Message } from 'node-nats-streaming'
import { TicketCreatedEvent } from './ticket-created-event'
import { Subjects } from './subjects'

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated // the channel we want to listen to. readonly prevents a property of a class from being changed
    queueGroupName = 'payments-service' // we are joining the queue group with other services. When an event comes in, it will be randomly distributed to one of the listeners inside the queue group

    onMessage(data: TicketCreatedEvent['data'], msg: Message) { // receieves our data from the event 
        console.log('Event data!', data)

        console.log(data.id)
        console.log(data.title)
        console.log(data.price)

        msg.ack() // acknowledge the message after saving it to db (or doing whatever with it) and tell nats that it has been processed
    }
}