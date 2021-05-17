import { Document, model, Model, Schema } from 'mongoose'
import { updateIfCurrentPlugin } from 'mongoose-update-if-current'

// The Payment object is used to relate together an order and a charge together
interface PaymentAttrs {
    orderId: string
    stripeId: string
}

// An interface that describes that a Payment document has
// add more properties to the Document
interface PaymentDoc extends Document {
    orderId: string
    stripeId: string
}

// An interface that describes the properties that a Payment model has
// add more properties to the Model
interface PaymentModel extends Model<PaymentDoc> {
    build(attrs: PaymentAttrs): PaymentDoc
}

// Schema - how we tell mongoose about all of the different properties a Payment is going to have
// version is maintained automatically so we don't have to list it here
const PaymentSchema = new Schema({
    orderId: {
        type: String,
        required: true
    },
    stripeId: {
        type: String,
        required: true,
    }
}, {
    toJSON: { // modify the JSON response we get back 
        transform(doc, ret) {
            ret.id = ret._id
            delete ret._id
        }
    }
})

// wrap new Payment in a function so we can use typescript with it
PaymentSchema.statics.build = (attrs: PaymentAttrs) => {
    return new Payment(attrs)
}

// Feed the Schema into mongoose and mongoose will create a new model based off that schema
const Payment = model<PaymentDoc, PaymentModel>('Payment', PaymentSchema)

export { Payment };