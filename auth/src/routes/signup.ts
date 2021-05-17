import { Router, Request, Response } from 'express';
import { body } from 'express-validator'; // function that checks the body of the incoming request
import jwt from 'jsonwebtoken';
import { validateRequest, BadRequestError } from '@ajktickets/common'
import { User } from '../models/user';

const router = Router();

router.post('/api/users/signup', 
    [
    body('email') // in the body of the incoming request, look for the email property
        .isEmail()
        .withMessage('Email must be valid'),
    body('password')
        .trim() // sanitization. makes sure there are no leading or trailing spaces on the password
        .isLength({ min: 4, max: 20 })
        .withMessage('Password must be between 4 and 20 characters')
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const { email, password } = req.body;

        const existingUser = await User.findOne({ email })

        // if that email already exists in our db
        if (existingUser) {
            throw new BadRequestError('Email is already in use!')
        }

        const user = User.build({ email, password })
        await user.save() // saves user to the db

        // generate JWT
        const userJwt = jwt.sign({
            id: user.id,
            email: user.id
        }, process.env.JWT_KEY!) // the ! lets typescript know that this variable has already been defined

        // store JWT on session object
        req.session = {
            jwt: userJwt
        }

        res.status(201).send(user)
    })

export { router as signUpRouter };