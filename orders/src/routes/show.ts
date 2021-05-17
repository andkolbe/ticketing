import { Request, Response, Router } from 'express'
import { NotAuthorizedError, NotFoundError, requireAuth } from '@ajktickets/common'
import { Order } from '../models/order'

const router = Router();

router.get('/api/orders/:orderId', requireAuth, async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.orderId).populate('ticket') // populate each order with the ticket information on that order

    if (!order) {
        throw new NotFoundError()
    }

    if (order.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError()
    }

    res.send(order)
})

export { router as showOrderRouter }