import { Request, Response, Router } from 'express'
import { requireAuth } from '@ajktickets/common'
import { Order } from '../models/order'

const router = Router();

// you can only acces your orders if you are authenticated
router.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
    const orders = await Order.find({ 
        userId: req.currentUser!.id
     }).populate('ticket') // populate each order with the ticket information on that order

    res.send(orders)
})

export { router as indexOrderRouter }