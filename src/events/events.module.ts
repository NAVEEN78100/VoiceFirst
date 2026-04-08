import { Module } from '@nestjs/common';
import { FeedbackSubmittedListener } from './listeners/feedback-submitted.listener';
import { CaseModule } from '../case/case.module';
import { EventsController } from './events.controller';

/**
 * EventsModule
 *
 * Owns all event listener registrations for the VoiceFirst system.
 *
 * Design:
 *  - EventEmitterModule is registered globally in AppModule — no re-import needed here.
 *  - All listeners are declared as providers so NestJS injects their dependencies.
 *  - CaseModule is imported here so CaseService is available to the listener.
 *
 * To add a new listener:
 *  1. Create the listener file under `listeners/`
 *  2. Add it to the `providers` array below
 *  3. Import any modules whose services it depends on
 */
@Module({
  imports: [CaseModule],
  controllers: [EventsController],
  providers: [FeedbackSubmittedListener],
})
export class EventsModule {}
