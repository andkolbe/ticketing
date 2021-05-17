import { Router } from 'express';
import { currentUser } from '@ajktickets/common'

const router = Router();

router.get('/api/users/currentuser', currentUser, (req, res) => {
    res.send({ currentUser: req.currentUser || null }) // send back null instead of undefined
})

export { router as currentUserRouter }; 