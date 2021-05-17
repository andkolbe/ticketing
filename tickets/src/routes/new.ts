import { Request, Response, Router } from 'express'
import { body } from 'express-validator' // validates certain incoming properties on the request body
import { requireAuth, validateRequest } from '@ajktickets/common'
import { Ticket } from '../models/ticket'
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher'
import { natsWrapper } from '../nats-wrapper'

const router = Router();

router.post('/api/tickets', requireAuth, [ // we want the validation to happen after the user is authenticated
    body('title')
        .not()
        .isEmpty()
        .withMessage('Title is required'),
    body('price')
        .isFloat({ gt: 0 }) 
        .withMessage('Price must be greater than 0')
], validateRequest, async (req: Request, res: Response) => {
    const { title, price } = req.body

    const ticket = Ticket.build({
        title,
        price,
        userId: req.currentUser!.id // we have access to currentUser because we set it in app.ts
    })
    await ticket.save()

    // we want to publish an event after saving the ticket to the database
    await new TicketCreatedPublisher(natsWrapper.client).publish({
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        version: ticket.version
    })

    res.status(201).send(ticket)
})

export { router as createTicketRouter}