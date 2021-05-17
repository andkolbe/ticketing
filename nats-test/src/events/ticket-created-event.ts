import { Subjects } from './subjects'

// create a tight coupling between each subject and what types of data they can contain
export interface TicketCreatedEvent {
    subject: Subjects.TicketCreated
    // TicketCreated can only have a id, title, and price
    data: {
        id: string
        title: string
        price: number
    }
}