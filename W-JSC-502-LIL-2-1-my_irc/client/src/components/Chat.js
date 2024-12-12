import React, { useState, useRef, useEffect } from 'react';

function Chat({ currentChannel, messages, onSendMessage, globalMessages }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const handleSendMessage = () => {
    if (newMessage.trim() && !/[<>]/.test(newMessage)) {
      onSendMessage(currentChannel, newMessage);
      setNewMessage('');
    } else {
      console.error("Le message contient des caractères non autorisés.");
    }
  };

  const handleInsertCommand = (command) => {
    setNewMessage(command + ' ');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(); 
  };

  return (
    <div style={{ width: '50%', border: '2px solid #e5e7eb', padding: '2vh', marginLeft: '25%', marginTop: '2%', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
      <h3 className="font-semibold text-lg tracking-tight mb-3">Channel : {currentChannel}</h3>
      <ul className="pr-4 overflow-y-auto" style={{ wordBreak: 'break-all', maxHeight: '30vh' }}>
        {(messages[currentChannel] || []).map((msg, index) => (
          <li key={index} className="flex gap-3 my-4 text-sm" style={{ color: msg.user === 'System' ? 'green' : 'black' }}>
            <strong className="block font-bold">{msg.user}:</strong> {msg.text}
            {msg.user !== 'System' && <span className="text-gray-500 ml-2">{formatTimestamp(msg.timestamp)}</span>}
          </li>
        ))}
        {(messages.private || []).map((msg, index) => (
          <li key={index} className="flex gap-3 my-4 text-red-600 text-sm">
            <strong className="block font-bold text-red-700">{msg.user}:</strong> {msg.text}
            {msg.user !== 'System' && <span className="text-gray-500 ml-2">{formatTimestamp(msg.timestamp)}</span>}
          </li>
        ))}
        {globalMessages.map((msg, index) => (
          <li key={index} style={{ color: 'blue' }}>
            <strong>Global:</strong> {msg.text}
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
      <div className="flex items-center pt-0">
        <input
          className="flex h-10 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#9ca3af] disabled:cursor-not-allowed disabled:opacity-50 text-[#030712] focus-visible:ring-offset-2
          "
          placeholder="Entrer votre message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
              e.preventDefault();
            }
          }}
        />
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium text-[#f9fafb] disabled:pointer-events-none disabled:opacity-50 bg-[#c7c7c7] hover:bg-[#111827E6] h-10 px-4 py-2"
          onClick={handleSendMessage}>
          <img src={`${process.env.PUBLIC_URL}/envoyer.png`} alt="Envoyer" style={{ width: '42px', height: '40px' }} />
        </button>
      </div>
      <div style={{ marginTop: '3vh', display: 'flex', justifyContent: 'space-evenly' }}>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Changer son pseudo sur le serveur'
          onClick={() => handleInsertCommand('/nick')}
        >
          /nick
        </button>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Filtrer les channels'
          onClick={() => handleInsertCommand('/list')}
        >
          /list
        </button>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Créer un nouveau channel'
          onClick={() => handleInsertCommand('/create')}
        >
          /create
        </button>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Supprimer un channel existant'
          onClick={() => handleInsertCommand('/delete')}
        >
          /delete
        </button>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Rejoindre un channel existant'
          onClick={() => handleInsertCommand('/join')}
        >
          /join
        </button>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Quitter le channel actuel'
          onClick={() => handleInsertCommand('/leave')}
        >
          /leave
        </button>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Voir les utilisateurs connectés sur le channel'
          onClick={() => handleInsertCommand('/users')}
        >
          /users
        </button>
        <button className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          title='Envoyer un message privé à un destinataire'
          onClick={() => handleInsertCommand('/msg')}
        >
          /msg
        </button>
      </div>
    </div>
  );
}

export default Chat;
