import { Document, model, Model, Schema } from 'mongoose'
import { updateIfCurrentPlugin } from 'mongoose-update-if-current'
import { OrderStatus } from '@ajktickets/common'
import { TicketDoc } from './ticket'

export { OrderStatus } // have one source for everything Order related

// An interface that describes the properties that are requried to create a new Order
interface OrderAttrs {
    userId: string
    status: OrderStatus
    expiresAt: Date
    ticket: TicketDoc
}

// An interface that describes that a Order document has
// add more properties to the Document
interface OrderDoc extends Document {
    userId: string
    status: OrderStatus
    expiresAt: Date
    ticket: TicketDoc
    version: number
}

// An interface that describes the properties that a Order model has
// add more properties to the Model
interface OrderModel extends Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc
}

// Schema - how we tell mongoose about all of the different properties a Order is going to have
const OrderSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus), // double check to make sure mongoose sets the status to one of the ones in the enum
        default: OrderStatus.Created
    },
    expiresAt: {
        type: Schema.Types.Date
    },
    ticket: {
        type: Schema.Types.ObjectId,
        ref: 'Ticket'
    }
}, {
    toJSON: { // modify the JSON response we get back 
        transform(doc, ret) {
            ret.id = ret._id
            delete ret._id
        }
    }
})
// allows us to implement version control on all new and updated orders sent out
// increments document version numbers on each save, and prevents previous versions of a document from being saved over the current version
OrderSchema.set('versionKey', 'version')
OrderSchema.plugin(updateIfCurrentPlugin)

// wrap new Order in a function so we can use typescript with it
OrderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order(attrs)
}

// Feed the Schema into mongoose and mongoose will create a new model based off that schema
const Order = model<OrderDoc, OrderModel>('Order', OrderSchema)

export { Order };