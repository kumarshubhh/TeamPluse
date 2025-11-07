import Layout from './components/Layout.jsx';
import ChatWindow from './features/chat/ChatWindow.jsx';
import MessageInput from './features/chat/MessageInput.jsx';
import TypingIndicator from './features/chat/TypingIndicator.jsx';
import './styles/global.css';

export default function App() {
  // Temporary demo data
  const rooms = [
    { id: 'r1', name: 'General', members: [1, 2] },
    { id: 'r2', name: 'Dev Talk', members: [1] },
  ];
  const messages = [
    { id: '1', username: 'alice', content: 'Hello!', createdAt: Date.now() - 60000, isMine: false },
    { id: '2', username: 'me', content: 'Hi there 👋', createdAt: Date.now() - 30000, isMine: true },
  ];

  return (
    <Layout rooms={rooms} activeRoomId={'r1'} roomName={'General'}>
      <div className="h-full flex flex-col">
        <ChatWindow messages={messages} hasMore onLoadMore={() => {}} onScrollBottom={() => {}} />
        <TypingIndicator users={["alice"]} />
        <MessageInput onSend={(t) => console.log('send', t)} onTypingStart={() => {}} onTypingStop={() => {}} />
      </div>
    </Layout>
  );
}
