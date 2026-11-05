# Public Chat
A completely free & anonymous global chat app with smart instant moderation.

![](./screenshots/preview.png)

### Purpose
This app enables the world to discuss on a single topic at a time. It's made to enable everyone discussing topics together in a safe and open environment.

### Tech stack
- Typescript: Programming language
- Bun: Core runtime
- Websockets: Realtime communication
- Redis: Quick storage of messages
- Dicebear: Avatar generation
- React: Frontend Framework
- Cloudflare Workers AI: Utilizing AI in moderation
- Clef Flash: Model used for instant moderation of messages

### Moderation
Moderation is handled by Cloudflare Clef Flash hosted on Cloudflare Workers AI. The moderation check is done in under 2 seconds in most cases.

Moderation code & parameters are completely open source, available in [src/utils/moderate.ts](src/utils/moderate.ts).

### Repository Structure
Main branch: Deployed in production  
Preview branch: Deployed in preview for testing  
Other branches: Active development branches

Each environment has its own separate application and database.  
Preview URL: https://public-chat-preview.sg-app.com  
Production URL: https://public-chat.sg-app.com

### Deployment
The app & database is completely hosted on my own server located in Frankfurt, Germany.  

It is hosted using Docker on a self-hosted PaaS.

### Disclosure
No AI has been used in the development of this application. It's completely handwritten by me. This is one of my projects I built to prove I can code both with and without AI, this one being a non-AI one.