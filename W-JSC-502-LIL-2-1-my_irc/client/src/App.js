import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import UserList from './components/UserList';
import ChannelList from './components/ChannelList';
import Chat from './components/Chat';
import '../src/index.css'; 

const socket = io('http://localhost:3000');

function App() {
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState(JSON.parse(sessionStorage.getItem('channels')) || []);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [previousChannel, setPreviousChannel] = useState(null);
  const [messages, setMessages] = useState({});
  const [globalMessages, setGlobalMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('currentChannel');
  }, []);

  useEffect(() => {
    if (isLoggedIn && username) {
      socket.emit('login', username);
    }

    socket.on('userList', (userList) => {
      setUsers(userList);
    });

    socket.on('channelList', (channelList) => {
      setChannels(channelList);
      sessionStorage.setItem('channels', JSON.stringify(channelList));
    });

    socket.on('newMessage', (channelName, message) => {
      setMessages((prevMessages) => ({
        ...prevMessages,
        [channelName]: [...(prevMessages[channelName] || []), message],
      }));
    });

    socket.on('privateMessage', ({ from, to, message }) => {
      const privateMsg = { user: from, text: `[${to}] ${message}` };
      setMessages((prevMessages) => ({
        ...prevMessages,
        private: [...(prevMessages.private || []), privateMsg],
      }));
    });

    socket.on('globalMessage', (message) => {
      setGlobalMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('channelError', (error) => {
      setErrorMessage(error);
      setTimeout(() => {
        setErrorMessage('');
        if (previousChannel) {
          handleJoinChannel(previousChannel, true);
        }
      }, 3000);
    });

    socket.on('channelDeleted', (deletedChannelName) => {
      setChannels((prevChannels) => prevChannels.filter(channel => channel.name !== deletedChannelName));
      if (currentChannel === deletedChannelName) {
        setCurrentChannel(null);
        sessionStorage.removeItem('currentChannel');
      }
    });

    return () => {
      socket.off('userList');
      socket.off('channelList');
      socket.off('newMessage');
      socket.off('privateMessage');
      socket.off('globalMessage');
      socket.off('channelError');
      socket.off('channelDeleted');
    };
  }, [isLoggedIn, username, previousChannel]);

  const handleUsernameClick = () => {
    setIsEditing(true);
    setNewUsername(username);
  };

  const handleInputChange = (e) => {
    setNewUsername(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmedNewUsername = newUsername.trim();
    const isValidUsername = /^[A-Za-z0-9_]+$/.test(trimmedNewUsername);
  
    if (isValidUsername) {
      setUsername(trimmedNewUsername);
      setIsEditing(false);
      setErrorMessage('');
      socket.emit('updateUsername', trimmedNewUsername);
      sessionStorage.setItem('username', trimmedNewUsername);
    } else {
      setErrorMessage("Le pseudo ne doit contenir que des lettres, des chiffres et des _");
    }
  };

  const handleLogin = (username) => {
    socket.emit('login', username);
    setUsername(username);
    setIsLoggedIn(true);
    sessionStorage.setItem('username', username);
  };

  const handleUpdateInfo = (newUsername) => {
    if (newUsername.trim()) {
      socket.emit('updateInfo', newUsername);
      setUsername(newUsername);
      sessionStorage.setItem('username', newUsername);
    }
  };

  const handleCreateChannel = (channelName) => {
    socket.emit('createChannel', channelName);
  };

  const handleUpdateChannel = (oldChannelName) => {
    const newChannelName = prompt("Veuillez écrire le nouveau nom du channel :");
    if (newChannelName) {
      socket.emit('updateChannel', oldChannelName, newChannelName);
    }
  };

  const handleDeleteChannel = (channelName) => {
    if (window.confirm("Êtes-vous sûr de supprimer ce channel ?")) {
      socket.emit('deleteChannel', channelName);
    }
  };

  const handleJoinChannel = (channelName, isReturning = false) => {
    if (!isReturning) {
      setPreviousChannel(currentChannel);
    }
    setCurrentChannel(channelName);
    sessionStorage.setItem('currentChannel', channelName);
    socket.emit('joinChannel', channelName);
    if (!isReturning) {
      setMessages((prevMessages) => ({
        ...prevMessages,
        [channelName]: []
      }));
    }
  };

  const handleLeaveChannel = () => {
    if (currentChannel) {
      socket.emit('leaveChannel', currentChannel);
      setCurrentChannel(null);
      sessionStorage.removeItem('currentChannel');
    }
  };

  const handleSendMessage = (channelName, message) => {
    if (message.trim()) {
      if (message.startsWith('/')) {
        handleCommand(message);
      } else {
        socket.emit('message', { channelName, message });
      }
    }
  };

  const handleCommand = (command) => {
    const args = command.split(' ');
    const mainCommand = args[0].toLowerCase();
    switch (mainCommand) {
      case '/nick':
        if (args[1]) {
          handleUpdateInfo(args[1]);
        }
        break;
      case '/list':
        socket.emit('listChannels', args[1] || '');
        break;
      case '/create':
        if (args[1]) {
          socket.emit('createChannel', args[1]);
        }
        break;
      case '/delete':
        if (args[1]) {
          socket.emit('deleteChannel', args[1]);
        }
        break;
      case '/join':
        if (args[1]) {
          handleJoinChannel(args[1]);
        }
        break;
      case '/leave':
        handleLeaveChannel();
        break;
      case '/users':
        socket.emit('listUsers', currentChannel);
        break;
      case '/msg':
        if (args[1] && args.slice(2).join(' ')) {
          socket.emit('privateMessage', { to: args[1], message: args.slice(2).join(' ') });
        }
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setNewUsername('');
    setUsers([]);
    setChannels([]);
    setCurrentChannel(null);
    setMessages({});
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('channels');
    sessionStorage.removeItem('currentChannel');
    socket.emit('customDisconnect');
  };

  return (
    <div className="App
    ">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2em', marginTop:'2vh', marginBottom:'4vh'}}>
            {!isEditing ? (
              <h2 onClick={handleUsernameClick} title="Modifier son pseudo" style={{ width: '200px', textAlign: 'center', fontFamily: "Verdana", 
                fontSize: '1.5em', textShadow: '4px 4px 8px #aaa', letterSpacing: '1px' }}> 
                {username || 'Veuillez entrer un pseudo'}
              </h2>
            ) : (
              <>
                <form onSubmit={handleFormSubmit}>
                  <input type="text" value={newUsername} onChange={handleInputChange} autoFocus
                    style={{ background: 'transparent', border: 'none', outline: 'none', width: '400px', textAlign: 'center', 
                             fontFamily: "Verdana", fontSize: '1.5em', textShadow: '4px 4px 8px #aaa', letterSpacing: '1px'
                    }}
                  />
                </form>
                {errorMessage && <div style={{ color: 'red', fontSize:'0.7em' }}>{errorMessage}</div>}
              </>
            )}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between'}}>
            <ChannelList
              channels={channels}
              socket={socket}
              onCreateChannel={handleCreateChannel}
              onJoinChannel={handleJoinChannel}
              onUpdateChannel={handleUpdateChannel}
              onDeleteChannel={handleDeleteChannel}
              onLeaveChannel={handleLeaveChannel}
            />
            <UserList users={users} currentUsername={username} onLogout={handleLogout} />
          </div>
          {errorMessage && (
            <div style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>{errorMessage}</div>
          )}
          {currentChannel && (
              <Chat
                currentChannel={currentChannel}
                messages={messages}
                onSendMessage={handleSendMessage}
                globalMessages={globalMessages}
              />
            )}
        </div>
      )}
    </div>
  );
}

export default App;
