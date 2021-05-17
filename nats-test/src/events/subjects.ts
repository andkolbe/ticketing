// a subject in the world of NATS is the name of a specific channel

// prevents us from writing string typos 
export enum Subjects {
    TicketCreated = 'ticket:created',
    OrderUpdated = 'order:updated'
}

