import request from 'supertest'
import { app } from '../../app'

// it('responds with details about the current user', async () => {
//     const cookie = await global.signin()

//     const response = await request(app)
//        .get('/api/users/currentuser')
//        .set('Cookie', cookie) // set the cookie header to be the one from the authResponse
//        .send()
//        .expect(200)

//     // supertest by default does not manage cookies for us automatically

//     expect(response.body.currentUser.email).toEqual('test@test.com')
// })

it('responds with null if not authenticated', async () => {
    const response = await request(app)
       .get('/api/users/currentuser')
       .send()
       .expect(200)

    expect(response.body.currentUser).toEqual(null)
})