import request from 'supertest'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'
import { natsWrapper } from '../../nats-wrapper'
import { Types } from  'mongoose'

it('marks an order as cancelled', async () => {
    // create a ticket
    const ticket = Ticket.build({
        id: Types.ObjectId().toHexString(),
        title: 'Concert',
        price: 20
    })
    await ticket.save()

    const user = global.signin() // persist the same user for all of our tests

    // make a request to create an order
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(201)

    // make request to cancel the order
    await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Cookie', user)
        .send()
        .expect(204)
    
})

it('emits an order cancelled event', async () => {
    // create a ticket
    const ticket = Ticket.build({
        id: Types.ObjectId().toHexString(),
        title: 'Concert',
        price: 20
    })
    await ticket.save()

    const user = global.signin() // persist the same user for all of our tests

    // make a request to create an order
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(201)

    // make request to cancel the order
    await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Cookie', user)
        .send()
        .expect(204)

    expect(natsWrapper.client.publish).toHaveBeenCalled()
})
