import ReconnectingWebSocket from 'reconnecting-websocket';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./index.css";
import { toast, Toaster } from 'sonner';
import UmamiAnalytics from './utils/analytics';

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

      // Silently fail if Umami is not initialized
      try {
        (window as any).umami.track('Send message');
      } catch { }
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
      toast.error('Websocket errored out: ' + JSON.stringify(e));
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
      <UmamiAnalytics name={my.name} />
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
            <input onBlur={e => window.scrollTo(0, 0)} onKeyDown={e => e.key === 'Enter' && SendMessage()} ref={msgInputRef} type="text" className="chat-input" placeholder="Enter your message..." maxLength={process.env.BUN_PUBLIC_MESSAGE_SIZE_LIMIT as unknown as number || 400} />
            <button className="btn-send" onClick={() => SendMessage()}>
              <svg width="70%" height="70%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.5004 12H5.00043M4.91577 12.2915L2.58085 19.2662C2.39742 19.8142 2.3057 20.0881 2.37152 20.2569C2.42868 20.4034 2.55144 20.5145 2.70292 20.5567C2.87736 20.6054 3.14083 20.4869 3.66776 20.2497L20.3792 12.7296C20.8936 12.4981 21.1507 12.3824 21.2302 12.2216C21.2993 12.082 21.2993 11.9181 21.2302 11.7784C21.1507 11.6177 20.8936 11.5019 20.3792 11.2705L3.66193 3.74776C3.13659 3.51135 2.87392 3.39315 2.69966 3.44164C2.54832 3.48375 2.42556 3.59454 2.36821 3.74078C2.30216 3.90917 2.3929 4.18255 2.57437 4.72931L4.91642 11.7856C4.94759 11.8795 4.96317 11.9264 4.96933 11.9744C4.97479 12.0171 4.97473 12.0602 4.96916 12.1028C4.96289 12.1508 4.94718 12.1977 4.91577 12.2915Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
