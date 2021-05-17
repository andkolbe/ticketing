import { Request, Response, Router } from 'express'
import { body } from 'express-validator' // validates certain incoming properties on the request body
import { NotFoundError, validateRequest, requireAuth, NotAuthorizedError, BadRequestError } from '@ajktickets/common'
import { Ticket } from '../models/ticket'
import { TicketUpdatedPublisher } from '../events/publishers/tickets-updated-publisher'
import { natsWrapper } from '../nats-wrapper'

const router = Router();

router.put('/api/tickets/:id', requireAuth, [
    body('title')
        .not()
        .isEmpty()
        .withMessage('Title is required'),
    body('price')
        .isFloat({ gt: 0 })
        .withMessage('Price must be provided and greater than 0')
], validateRequest, async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
        throw new NotFoundError()
    }

    if (ticket.orderId) { // if the ticket has an order id, it is connected to an active order, and should not be edited
        throw new BadRequestError('Cannot edit a reserved ticket')
    }

    if (ticket.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError()
    }

    ticket.set({
        title: req.body.title, 
        price: req.body.price
    })
    await ticket.save() // persists these values to mongo
    new TicketUpdatedPublisher(natsWrapper.client).publish({
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        version: ticket.version
    })

    res.send(ticket)
})

export { router as updateTicketRouter }
