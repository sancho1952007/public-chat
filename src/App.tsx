import ReconnectingWebSocket from 'reconnecting-websocket';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./index.css";
import { toast, Toaster } from 'sonner';

export function App() {
  const socketRef = useRef<ReconnectingWebSocket | null>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);
  const chatsSectionRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const [sideBarMobileExpanded, setSideBarMobileExpanded] = useState(false);

  const SendMessage = () => {
    if (msgInputRef.current!.value.trim() !== '') {
      socketRef.current?.send(msgInputRef.current!.value);
      msgInputRef.current!.value = '';
    }
  }

  const [connectedUsers, setConnectedUsers] = useState<{
    name: string
  }[]>([]);

  const [messages, setMessages] = useState<{
    id: string,
    user: string,
    content: string
  }[]>([]);

  const [my, setMy] = useState<{
    name: string
  }>({
    name: ''
  });

  useLayoutEffect(() => {
    if (shouldScrollRef.current && chatsSectionRef.current) {
      chatsSectionRef.current.scrollTop = chatsSectionRef.current.scrollHeight;
    }
    shouldScrollRef.current = false;
  }, [messages]);

  useEffect(() => {
    const ws = new ReconnectingWebSocket('/ws', [], {
      connectionTimeout: 1000,
      maxRetries: 5
    });
    socketRef.current = ws;

    ws.onmessage = (e) => {
      const message = JSON.parse(e.data);
      switch (message.type) {
        case 'message': {
          if (chatsSectionRef.current) {
            const el = chatsSectionRef.current;
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            shouldScrollRef.current = distanceFromBottom <= 100;
          }

          setMessages(msg => [...msg, {
            id: message.data.id,
            content: message.data.content,
            user: message.data.user
          }]);
          break;
        }

        case 'current-user-context': {
          setMy({
            name: message.data.name
          });
          break;
        }

        case 'connected-users-list': {
          setConnectedUsers(message.clients);
          break;
        }

        case 'messages-list': {
          const messages = message.messages as string[];
          const parsed_messages = messages.map(msg => JSON.parse(msg));
          shouldScrollRef.current = true;
          setMessages(parsed_messages);
          break;
        }

        case 'user-joined': {
          const user = message.name;
          // Push new user to top of list
          setConnectedUsers(e => [{
            name: user
          }, ...e]);
          break;
        }

        case 'user-left': {
          const user = message.name;
          // Remove user from list when they leave
          setConnectedUsers(e => e.filter(x => x.name !== user));
          break;
        }

        case 'error': {
          toast.error(message.data.error_message, {
            description: message.data.error_desc
          });
          break;
        }

        case 'end-connection': {
          ws.close();
          break;
        }

        default: {
          console.log('Unhandled message type: ' + message.type);
          break;
        }
      }
    }

    ws.onerror = (e) => {
      toast.error('Websocket errored out: ' + e);
    }

    ws.onclose = () => {
      console.log('Websocket closed');
    }

    ws.onopen = () => {
      console.log('Websocket opened');
    }

    return () => ws.close();
  }, []);

  return (
    <div className="app">
      <Toaster />
      <div className="main-header">
        <img onClick={() => setSideBarMobileExpanded(e => !e)}
          className='hamburger-menu'
          src={require('./assets/hamburger-menu.svg')} />
        <h1>Public Chat</h1>
      </div>

      <div className="container">
        <div className={`sidebar ${sideBarMobileExpanded ? 'open' : 'closed'}`}>
          {connectedUsers.map(e => {
            return (
              <div className="person" key={e.name}>
                <div className="left">
                  <img src={`/pfp/${e.name}`} alt="" className="pfp" />
                </div>
                <div className="right">
                  <div className="name">
                    {e.name}
                  </div>
                  <div className="status">Online</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chat-area">
          <div className="chats" ref={chatsSectionRef}>
            {
              messages.map(msg => {
                return (
                  <div key={msg.id} className={`chat ${msg.user === my.name ? 'sent' : 'received'}`}>
                    <div className="up">
                      <img src={`/pfp/${msg.user}`} alt="" className="pfp" />
                      <div className="name">{msg.user}</div>
                    </div>

                    <div className="down">
                      <div className="content">{msg.content}</div>
                    </div>
                  </div>
                );
              })
            }
          </div>

          <div className="input-section">
            <input onKeyDown={e => e.key === 'Enter' && SendMessage()} ref={msgInputRef} type="text" className="chat-input" placeholder="Enter your message..." maxLength={process.env.BUN_PUBLIC_MESSAGE_SIZE_LIMIT ? parseInt(process.env.BUN_PUBLIC_MESSAGE_SIZE_LIMIT) : 400} />
            <button className="btn-send" onClick={() => SendMessage()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
