import createClient from '@dylibso/xtp'

const xtpClient = await createClient({
  appId: 'app_01htd7yn3ser4936ncbc4adasa',
  token: String(process.env.XTP_TOKEN),
  // typescript plug-ins need WASI, this is a minor detail that isn't important at the moment
  useWasi: true
})

/**
 * @typedef {Object} Message
 * @property {string} body - The body of the message.
 * @property {string} type - The type of the message: {'text','html','image'}
 * @property {string} nick - The nickname of the sender.
 */

/**
 * This built-in command counts the vowels in the message and responds
 * with a count.
 *
 * @param {Message} Input message from user 
 * @returns {Message} Response message from bot
 */
function countvowels(message) {
  const vowels = ['a', 'e', 'i', 'o', 'u']
  let count = 0;
  for (const c of message.body) {
    if (vowels.includes(c)) count++
  }
  return {
    body: `countvowels: ${count}`,
    type: 'text',
    nick: 'bot',
  }
}

// These are all our built in commands
const BUILTIN_COMMANDS = {
  countvowels
}

const GUEST_KEY = 'my-guest-key'
const EXT_NAME = 'slashcommand'

// change this implementation to include guest commands
export async function getCommands() {
  return Object.keys(BUILTIN_COMMANDS).concat(await xtpClient.listAvailablePlugins(
    EXT_NAME,
    GUEST_KEY,
  ))
}

// add this helper function
async function runSlashCommand(commandName, message) {
  // our Extension Point is:             `SlashCommand`
  // our export that we want to call is: `handleMessage`
  const pluginFunc = xtpClient.extensionPoints[EXT_NAME].handleMessage

  const result = await pluginFunc(
    GUEST_KEY,
    JSON.stringify(message), // The plug-in expects a json Message
    {
      // this is by default the name of our plugin,
      // which is the name of the command
      bindingName: commandName,
      default: "{}"
    }
  )
  return JSON.parse(result)
}

/**
 * Handles a message
 */
export async function commandHandler(message) {
  // split into command and commandBody
  const re = new RegExp('^/([^\\s]+)\\s*(.*)$');
  const [_full, commandName, commandBody] = message.body.match(re)
  // replace the body with just the arguments to the command for simplicity
  if (commandBody) message.body = commandBody

  let botMessage = {
    body: `Error: unknown command ${commandName}`,
    type: 'text',
    nick: 'bot',
  }

  const command = BUILTIN_COMMANDS[commandName]
  if (command) {
    botMessage = command(message)
  } else { // add this else clause
    // if we fail to find the command in the built-ins, let's check xtp
    const pluginCommands = await xtpClient.listAvailablePlugins(
      EXT_NAME,
      GUEST_KEY,
    )
    if (pluginCommands.includes(commandName)) {
      // running a plugin is no different than calling a normal function
      // but it's sandboxed and language independent thanks to Wasm
      botMessage = await runSlashCommand(commandName, message)
    }
  }

  botMessage.nick = 'bot'

  return {
    type: "message",
    payload: botMessage
  }
}
