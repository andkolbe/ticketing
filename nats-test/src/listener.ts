import { TicketCreatedListener } from './events/ticket-created-listener'
import { connect } from 'node-nats-streaming'
import { randomBytes } from 'crypto'

console.clear()

// a client is what actually connects to our nats streaming server and try to exchange some information with it\
// second parameter is the client id. It can be anything you want
const client = connect('ticketing', randomBytes(4).toString('hex'), {
    url: 'http://localhost:4222'
})

client.on('connect', () => {
    console.log('Listener connected to NATS')

    client.on('close', () => {
        console.log('NATS connection closed')
        process.exit()
    })

    new TicketCreatedListener(client).listen()
})

// runs anytime our listener closes or restarts. Doesn't always work on windows
process.on('SIGINT', () => client.close()) // interrupt
process.on('SIGTERM', () => client.close()) // terminate

