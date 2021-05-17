import { Document, model, Model, Schema } from 'mongoose'
import { updateIfCurrentPlugin } from 'mongoose-update-if-current'

interface TicketAttrs {
    title: string
    price: number
    userId: string
}

interface TicketDoc extends Document {
    title: string
    price: number
    userId: string
    orderId?: string // optional. either string or undefined
    version: number
}

interface TicketModel extends Model<TicketDoc> {
    build(attrs: TicketAttrs): TicketDoc
}

const ticketSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    orderId: {
        type: String
    }
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
    return new Ticket(attrs)
}

const Ticket = model<TicketDoc, TicketModel>('Ticket', ticketSchema)

export { Ticket }