import { Message, Stan } from 'node-nats-streaming'
import { Subjects } from './subjects'

interface Event {
    subject: Subjects
    data: any
}

// set Listener up as a generic class
export abstract class Listener<T extends Event> { // whenever we try to make use of Listener, we have to provide some custom type
    abstract subject: T['subject']
    abstract queueGroupName: string
    abstract onMessage(data: T['data'], msg: Message): void
    private client: Stan
    protected ackWait = 5 * 1000  //  protected means the subclass can define it if it wants to

    constructor(client: Stan) {
        this.client = client
    }

    subscriptionOptions() {
        return this.client
            .subscriptionOptions()
            // makes sure that the first time a subscription is created, that subscription receives all events emitted in the past
            .setDeliverAllAvailable()
            // by default, as soon as we receive an event, it is no longer in memory. If the db goes down or the connection is lost that event, is lost forever. 
            // Setting acknowledgement to true means we will only acknowledge the message after we have saved it. We now need to add code to acknowledge it
            .setManualAckMode(true)
            .setAckWait(this.ackWait)
            // any events sent in the past will be marked as delivered. Doesn't send anything unnecessary
            .setDurableName(this.queueGroupName)
    }

    listen() {
        // we want to subscribe to the ticket:created channel (topic)
        // second argument is for the queue group we want to subscribe to. Kind of like a subchannel
        const subscription = this.client.subscribe(
            this.subject,
            this.queueGroupName,
            this.subscriptionOptions()
        )

        subscription.on('message', (msg: Message) => {
            console.log(
                `Message received: ${this.subject} / ${this.queueGroupName}`
            )

            const parsedData = this.parseMessage(msg)
            this.onMessage(parsedData, msg)
        })
    }

    parseMessage(msg: Message) {
        const data = msg.getData()
        return typeof data === 'string'
            ? JSON.parse(data)
            : JSON.parse(data.toString('utf8')) // parse the buffer into a string
    }
}
