import { connect } from 'node-nats-streaming'
import { TicketCreatedPublisher } from './events/ticket-created-publisher'

console.clear()

// a client is what actually connects to our nats streaming server and try to exchange some information with it\
// second parameter is the client id. It can be anything you want
const client = connect('ticketing', 'abc', {
    url: 'http://localhost:4222'
})

// no async/await with nats
client.on('connect', async () => {
    console.log('Publisher connected to NATS')

    const publisher = new TicketCreatedPublisher(client)
    try {
        await publisher.publish({
            id: '123',
            title: 'concert',
            price: 20
        })
    } catch (err) {
        console.log(err)
    }

    // // we can only send strings with nats
    // const data = JSON.stringify({
    //     id: '123',
    //     title: 'concert',
    //     price: 20
    // })

    // // we want to publish this data to the ticket:created channel (topic)
    // client.publish('ticket:created', data, () => { 
    //     console.log('Event published') // optional callback function to run after the data has been published
    // })
})