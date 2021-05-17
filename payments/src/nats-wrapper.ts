import  { connect, Stan } from 'node-nats-streaming'

// all the code to connect to our nats server
class NatsWrapper {
    private _client?: Stan

    get client() {
        if (!this._client) {
            throw new Error('Cannot access NATS client without connecting')
        }

        return this._client
    }

    connect(clusterId: string, clientId: string, url: string) {
        this._client = connect(clusterId, clientId, { url })

        // wrap in a Promise so we can use async/await instead of callback function
        return new Promise<void>((resolve, reject) => {
            this.client.on('connect', () => {
                console.log('Connected to NATS')
                resolve()
            })
            this.client.on('error', (err) => {
                reject(err)
            })
        })
    }
}

export const natsWrapper = new NatsWrapper()