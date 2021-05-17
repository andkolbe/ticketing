import { Request, Response, Router } from 'express'
import { body } from 'express-validator' // validates certain incoming properties on the request body
import { BadRequestError, NotFoundError, OrderStatus, requireAuth, validateRequest } from '@ajktickets/common'
import { Ticket } from '../models/ticket'
import { Order } from '../models/order'
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher'
import { natsWrapper } from '../nats-wrapper'

const router = Router();

const EXPIRATION_SECONDS = 15 * 60 // 15 min

router.post('/api/orders', requireAuth, [
    body('ticketId')
        .not()
        .isEmpty()
        .withMessage('TicketId must be provided')
], validateRequest, async (req: Request, res: Response) => {
    const { ticketId } = req.body
    // find the ticket the user is trying to order in the db
    const ticket = await Ticket.findById(ticketId)
    if (!ticket) {
        throw new BadRequestError('Ticket is already reserved')
        throw new NotFoundError()
    }

    // make sure the ticket is not already reserved
    const isReserved  = await ticket.isReserved() 
    if (isReserved) {
        throw new BadRequestError('Ticket is already reserved')
    }

    // calculate an expiration date for this order
    const expiration = new Date()
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_SECONDS)

    // build the order and save it to the db
    const order = Order.build({
        userId: req.currentUser!.id,
        status: OrderStatus.Created,
        expiresAt: expiration,
        ticket
    })
    await order.save() // save the order to the db

    // publish an event saying that an order was created
    new OrderCreatedPublisher(natsWrapper.client).publish({
        id: order.id,
        version: order.version,
        status: order.status,
        userId: order.userId,
        expiresAt: order.expiresAt.toISOString(), // UTC timestamp
        ticket: {
            id: ticket.id,
            price: ticket.price
        }
    })

    res.status(201).send(order)
})

export { router as newOrderRouter }