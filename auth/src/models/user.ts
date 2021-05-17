import { Document, model, Model, Schema } from 'mongoose'
import { Password } from '../services/password';

// An interface that describes the properties that are requried to create a new User
interface UserAttrs {
    email: string,
    password: string
}

// An interface that describes the properties that a User model has
// add more properties to the Model
interface UserModel extends Model<UserDoc> {
    build(attrs: UserAttrs): UserDoc
}

// An interface that describes that a User document has
// add more properties to the Document
interface UserDoc extends Document {
    email: string
    password: string
}

// Schema - how we tell mongoose about all of the different properties a user is going to have
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    toJSON: { // modify the JSON response we get back 
        transform(doc, ret) {
            ret.id = ret._id
            delete ret._id
            delete ret.password
            delete ret.__v
        }
    }
})

userSchema.pre('save', async function (done) { // pre 'save' is a middleware implemented in mongoose. execute this function whenever we save a document to our db
    // if the user's password is modified. Also runs when a user is first created
    if (this.isModified('password')) {
        const hashed = await Password.toHash(this.get('password'))
        this.set('password', hashed)
    }

    done()
})

// wrap new User in a function so we can use typescript with it
userSchema.statics.build = (attrs: UserAttrs) => {
    return new User(attrs)
}

// Feed the Schema into mongoose and mongoose will create a new model based off that schema
const User = model<UserDoc, UserModel>('User', userSchema)

export { User };