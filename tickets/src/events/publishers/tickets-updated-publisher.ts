import { Publisher, Subjects, TicketUpdatedEvent } from '@ajktickets/common'

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    readonly subject = Subjects.TicketUpdated
}
