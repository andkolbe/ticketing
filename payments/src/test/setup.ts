import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, connection, Types } from 'mongoose'
import request from 'supertest'
import { app } from '../app'
import jwt from 'jsonwebtoken'

declare global {
    namespace NodeJS {
        interface Global {
            signin(id?: string): string[]
        }
    }
}

jest.mock('../nats-wrapper') // mock the nats-wrapper when executing our tests
jest.mock('../stripe')

let mongo: any;

beforeAll(async () => {
    // we need to set our JWT_KEY here because we decoupled app.ts and index.ts
    process.env.JWT_KEY = 'lol'

    mongo = new MongoMemoryServer()
    const mongoUri = await mongo.getUri()

    await connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
})

beforeEach(async () => {
    jest.clearAllMocks() // reset mock data between all of our tests
    const collections = await connection.db.collections()

    for (let collection of collections) {
        await collection.deleteMany({})
    }
})

// stop the mongo server and mongoose after the tests are run
afterAll(async () => {
    await mongo.stop()
    await connection.close()
})

global.signin = (id?: string) => {
    // Build a JWT payload { id, email }
    const payload = {
        // generate a random id every time
        id: id || new Types.ObjectId().toHexString(),
        email: 'test@test.com'
    }

    // Create the JWT
    const token = jwt.sign(payload, process.env.JWT_KEY!)

    // Build session object { jwt: MY_JWT }
    const session = { jwt: token }

    // Turn that session into JSON
    const sessionJSON = JSON.stringify(session)

    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString('base64')

    // return a string that's the cookie with encoded data
    return [`express:sess=${base64}`] // supertest likes all cookies to be in an array
}