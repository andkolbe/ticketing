import { Publisher, OrderCancelledEvent, Subjects } from '@ajktickets/common'

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled
}