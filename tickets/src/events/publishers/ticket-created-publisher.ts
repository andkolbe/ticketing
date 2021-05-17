import { Publisher, Subjects, TicketCreatedEvent } from '@ajktickets/common'

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated
}

