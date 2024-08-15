#!/usr/bin/env node
import crypto from 'crypto'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import FastifyVite from '@fastify/vite'
import { FastifySSEPlugin } from "fastify-sse-v2"
import { getCommands, commandHandler } from './commands.js'

class EventStream {
  constructor() {
    this.listeners = new Set()
    this.messageId = 0
    this.messages = []
    this.startHeartBeat()
  }
  subscribe(listener) {
    this.messages.forEach(m => {
      listener.sse({
        data: m
      })
    })
    this.listeners.add(listener)
  }
  unsubscribe(listener) {
    this.listeners.delete(listener)
  }
  broadcast(msg) {
    const messageData = JSON.stringify(msg)
    this.listeners.forEach(c => {
      c.sse({
        id: String(this.messageId++),
        data: messageData
      })
    })
    this.messages.push(messageData)
  }
  startHeartBeat() {
    setTimeout(() => {
      this.broadcast({ type: "heartbeat", payload: { heartbeat: true } })
      this.startHeartBeat()
    }, 2000)
  }
}

const EVENTS = new EventStream()

export async function main(dev) {
  const server = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: false,
          translateTime: false,
          ignore: 'pid,hostname',
        }
      }
    }
  })

  await server.register(FastifyVite, {
    root: import.meta.url,
    dev: dev || process.argv.includes('--dev'),
    spa: true
  })
  await server.register(FastifySSEPlugin);

  server.get('/', (req, reply) => {
    return reply.html()
  })

  server.post('/messages', async (req, reply) => {
    // we're just assuming that they are who they say they are
    // that's okay for this demo
    let { nick, body } = req.body;

    // remove trailing spaces
    const endre = new RegExp('(&nbsp;)*\\s*(\\<br\\>)*$');
    body = body.replace(endre, '');

    const message = {
      type: "message",
      payload: {
        nick, body, type: 'text'
      }
    }

    EVENTS.broadcast(message)
    reply.status(201).send({ success: true })
    if (body.startsWith('/')) {
      EVENTS.broadcast(await commandHandler(message.payload))
    }
  })

  server.get("/events", function(req, reply) {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    EVENTS.subscribe(reply)
    req.raw.on('close', () => {
      EVENTS.unsubscribe(reply)
      reply.raw.end();
    })
  })

  server.get("/slash-commands", async (_, reply) => {
    reply.send({
      slash_commands: await getCommands()
    })
  })

  await server.vite.ready()
  return server
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await main()
  console.log(`Open http://0.0.0.0:3000`)
  await server.listen({ host: '0.0.0.0', port: 3000 })
}
