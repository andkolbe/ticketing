import request from 'supertest'
import { app } from '../../app'
import { Order, OrderStatus } from '../../models/order'
import { Types } from 'mongoose'
import { stripe} from '../../stripe'
import { Payment } from '../../models/payment'

it('returns a 404 when purchasing an order that does not exist', async () => {
    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin()) // user must be authenticated
        .send({
            token: 'token',
            orderId: Types.ObjectId().toHexString()
        })

    expect(404)
})

it('returns a 401 when purchasing an order that does not belong to the user', async () => {
    const order = Order.build({
        id: Types.ObjectId().toHexString(),
        userId: Types.ObjectId().toHexString(),
        version: 0,
        price: 20,
        status: OrderStatus.Created
    })
    await order.save()

    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin()) 
        .send({
            token: 'token',
            orderId: order.id
        })

    expect(401)
})

it('returns a 404 when purchasing a cancelled order', async () => {
    const userId = Types.ObjectId().toHexString()
    const order = Order.build({
        id: Types.ObjectId().toHexString(),
        userId,
        version: 0,
        price: 20,
        status: OrderStatus.Cancelled
    })
    await order.save()

    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin(userId)) 
        .send({
            token: 'token',
            orderId: order.id
        })

    expect(400)
})

it('returns a 204 with valid inputs', async () => {
    const userId = Types.ObjectId().toHexString()
    const order = Order.build({
        id: Types.ObjectId().toHexString(),
        userId,
        version: 0,
        price: 20,
        status: OrderStatus.Created
    })
    await order.save()

    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin(userId)) 
        .send({
            token: 'tok_visa',
            orderId: order.id
        })
        .expect(201)

    const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][1]
    expect(chargeOptions.source).toEqual('tok_visa')
    expect(chargeOptions.amount).toEqual(20 * 100)
    expect(chargeOptions.currency).toEqual('usd')

    const payment = await Payment.findOne({
        orderId: order.id,
        stripeId: chargeOptions.id
    })
    expect(payment).not.toBeNull()
})



