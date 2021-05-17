import { scrypt, randomBytes } from 'crypto' // scrypt is callback based
import { promisify } from 'util' // use promisfy with scrypt

const scryptAsync = promisify(scrypt)

export class Password {
    // static methods are methods we can access without creating an instance of the class
    static async toHash(password: string) {
        const salt = randomBytes(8).toString('hex')
        const buf = (await scryptAsync(password, salt, 64)) as Buffer

        return `${buf.toString('hex')}.${salt}`
    }

    static async compare(storedPassword: string, suppliedPassword: string) {
        const [hashedPassword, salt] = storedPassword.split('.')
        const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer

        return buf.toString('hex') === hashedPassword
    }
}

/*
we can acces both of these static methods as
Password.toHash
Password.compare 

instead of 

new Password().toHash
new Password().compare
*/