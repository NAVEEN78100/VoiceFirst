import { Controller, Sse, UseGuards, Req } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { EVENTS } from './events.constants';
import { FeedbackSubmittedPayload } from './interfaces/feedback-submitted.payload';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Sse('notifications')
  @UseGuards(JwtAuthGuard)
  notifications(@Req() req: any): Observable<MessageEvent> {
    const user = req.user;
    
    return new Observable((subscriber) => {
      const listener = (payload: FeedbackSubmittedPayload) => {
        // Basic RBAC filtering for notifications (similar to how getFeedbackExplorer works)
        if (user.role === 'MANAGER' && payload.branchId !== user.branchId) {
          return; // Ignore if not from same branch
        }
        
        // If STAFF, we might only notify them if it's their touchpoint, 
        // but for now, any staff in the branch gets the heads-up.
        
        subscriber.next({
          data: payload,
        } as MessageEvent);
      };

      this.eventEmitter.on(EVENTS.FEEDBACK_SUBMITTED, listener);

      return () => {
        this.eventEmitter.off(EVENTS.FEEDBACK_SUBMITTED, listener);
      };
    });
  }
}
