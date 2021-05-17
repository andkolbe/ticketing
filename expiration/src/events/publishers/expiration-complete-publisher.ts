import { Publisher, ExpirationCompleteEvent, Subjects } from '@ajktickets/common'

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    readonly subject = Subjects.ExpirationComplete
}