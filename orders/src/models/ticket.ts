import { Document, model, Model, Schema } from 'mongoose'
import { updateIfCurrentPlugin } from 'mongoose-update-if-current'
import { Order, OrderStatus } from './order'

interface TicketAttrs {
    id: string
    title: string
    price: number
}

export interface TicketDoc extends Document {
    title: string
    price: number
    version: number
    isReserved(): Promise<boolean>
}

interface TicketModel extends Model<TicketDoc> {
    build(attrs: TicketAttrs): TicketDoc
    findByEvent(event: { id: string, version: number }): Promise<TicketDoc | null>
}

const ticketSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0  // min price must be 0
    },
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id
            delete ret._id
        }
    }
})
// allows us to implement version control on all new and updated tickets sent out
// increments document version numbers on each save, and prevents previous versions of a document from being saved over the current version
ticketSchema.set('versionKey', 'version')
ticketSchema.plugin(updateIfCurrentPlugin)

ticketSchema.statics.build = (attrs: TicketAttrs) => { 
    return new Ticket({
        _id: attrs.id,
        title: attrs.title,
        price: attrs.price
    })
}
ticketSchema.statics.findByEvent = (event: { id: string, version: number }) => {
    return Ticket.findOne({
        _id: event.id,
        version: event.version - 1 // we want to make sure we are updating the ticket only if its version number is one less than the current
    })
}

// run query to look at all orders. Find an order where the ticket is the ticket we just found and the orders status is not cancelled
// if we find an order from that means the ticket is reserved
ticketSchema.methods.isReserved = async function() {
    // this === the ticket document that we just called 'isReserved' on
    const existingOrder = await Order.findOne({
        ticket: this,
        status: {
            $in: [ // $in is a special mongodb operator. Our status must not be OrderStatus.Cancelled
                OrderStatus.Created,
                OrderStatus.AwaitingPayment,
                OrderStatus.Complete
            ]
        }
    })

    // if existingOrder = null, it will be flipped to true, with the first exclamation, and flipped to false with the second one
    // if existingOrder is defined, it will be flipped to false, and then be flipped to true
    return !!existingOrder
}

const Ticket = model<TicketDoc, TicketModel>('Ticket', ticketSchema)

export { Ticket }