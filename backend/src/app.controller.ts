import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      name: 'VoiceFirst API',
      version: '1.0.0',
      status: 'OPERATIONAL',
      message: 'Welcome to the VoiceFirst Intelligent Feedback System.',
      documentation: '/api/v1',
    };
  }
}
