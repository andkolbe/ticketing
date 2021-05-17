import { Publisher, PaymentCreatedEvent, Subjects } from '@ajktickets/common'

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
    readonly subject = Subjects.PaymentCreated
}