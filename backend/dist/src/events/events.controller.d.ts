import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
export declare class EventsController {
    private readonly eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    notifications(req: any): Observable<MessageEvent>;
}
