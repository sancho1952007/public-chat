import { serve } from "bun";
import index from "./index.html";
import { RedisClient } from "bun";
import { Moderate } from "./utils/moderate";
import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/line-face.json' with { type: 'json' };
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

const redis = new RedisClient(Bun.env.REDIS_URL);
let lastMessages = (await redis.lrange("messages:list", 0, 19)).reverse();
const limit = Bun.env.BUN_PUBLIC_MESSAGE_SIZE_LIMIT as unknown as number || 400;

const style = new Style(definition);
let clients: {
  name: string
}[] = [];

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    '/ws': (req, server: Bun.Server<{ auth: boolean, name: string, ip: string }>) => {
      const ip = req.headers.get('CF-Connecting-IP') || server.requestIP(req)?.address || '127.0.0.1';
      const name = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: "-",
        seed: ip,
        style: "lowerCase"
      });

      if (!server.upgrade(req, {
        data: {
          // If the user already exists in client list, set auth as false so that a friendly disconnection error message can be sent after connection
          auth: !clients.some(e => e.name === name),
          name: name,
          ip
        }
      })) {
        return new Response('Websocket upgrade failed', { status: 500 });
      }
    },
    '/pfp/:name': (req) => {
      // Generate a custom avatar based on the name of the user
      const avatar = new Avatar(style, {
        "seed": req.params.name
      });

      return new Response(avatar.toString(), {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  },

  websocket: {
    async message(ws, message) {
      if (message.length > limit) {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            error_message: 'Message size warning',
            error_desc: `Limit of ${limit} characters exceeded!`
          }
        }));
        return;
      }

      const currentRL = await redis.get(`rl:${ws.data.ip}`);
      if (currentRL) {
        if (parseInt(currentRL) < (Bun.env.RL_COUNT as unknown as number || 30)) { // Default 30 messages in the time period
          await redis.incr(`rl:${ws.data.ip}`);
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              error_message: 'Rate limit exhausted',
              error_desc: 'Your rate limit has been exhausted. Please wait before posting more messages'
            }
          }));
          return;
        }
      } else {
        await redis.set(`rl:${ws.data.ip}`, "1", 'EX', (Bun.env.RL_PERIOD as unknown as number) || 86400); // default 24 hour expiry of rate limit key
      }
      const moderation = await Moderate(message.toString());
      if (!moderation.success) {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            error_message: 'Moderation Error',
            error_desc: 'Something went wrong with moderation'
          }
        }));
        return;
      }
      if (moderation.allowed) {
        const msg_id = Bun.randomUUIDv7();
        server.publish('chat', JSON.stringify({
          type: 'message',
          data: {
            id: msg_id,
            content: message,
            user: ws.data.name,
            ts: Date.now()
          }
        }));

        // Push message into lastMessages array
        lastMessages.push(JSON.stringify({ id: msg_id, content: message, user: ws.data.name, ts: Date.now() }));
        if (lastMessages.length > 20) lastMessages.shift();

        // Store the messages to redis
        await redis.lpush("messages:list", JSON.stringify({
          id: msg_id,
          content: message,
          user: ws.data.name,
          ts: Date.now()
        }));

        // Keep last 30 messages by default or more as per supplied values
        await redis.ltrim("messages:list", 0, ((Bun.env.MAX_MESSAGES as unknown as number) - 1 || 29));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            error_message: 'Moderation Notice',
            error_desc: 'Your message was blocked for ' + moderation.violation + '. Repeated rule breaking will lead to a 24h ban.'
          }
        }));
      }
    },
    async open(ws) {
      // When the auth is false as stated in above code, disconnect the user from the ws connection after sending a friendly error message
      if (ws.data.auth === false) {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            error_message: 'A user with this username is already connected. If you have another tab of this website open, please close it.'
          }
        }));

        ws.send(JSON.stringify({
          type: 'end-connection'
        }));

        ws.close(1000);
        return;
      }

      clients.push({
        name: ws.data.name
      });

      ws.send(JSON.stringify({
        type: 'current-user-context',
        data: {
          name: ws.data.name
        }
      }));

      ws.send(JSON.stringify({
        type: 'connected-users-list',
        clients
      }));

      server.publish('user-joined', JSON.stringify({
        type: 'user-joined',
        name: ws.data.name
      }));

      ws.subscribe("user-joined");
      ws.subscribe("user-left");

      ws.send(JSON.stringify({
        type: 'messages-list',
        messages: lastMessages
      }));

      ws.subscribe("chat");
    },
    close(ws) {
      // If the user was force disconnected from the server, ignore the cleanup step since connection wasn't approved in the first place
      if (ws.data.auth === false) {
        return;
      }

      clients = clients.filter(e => e.name !== ws.data.name);

      server.publish('user-left', JSON.stringify({
        type: 'user-left',
        name: ws.data.name
      }));
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
