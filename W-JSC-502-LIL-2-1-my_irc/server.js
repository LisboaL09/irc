const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Serveur IRC en fonctionnement!');
});

const users = {};
const channels = [];
const userChannels = {};

io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');

  socket.on('login', (username) => {
    if (username && !Object.values(users).some(user => user.username === username)) {
      users[socket.id] = { username, id: socket.id, currentChannel: null, ownedChannels: [], joinedChannels: [] };
      userChannels[socket.id] = [];
      io.emit('userList', Object.values(users).map(user => user.username));
      socket.emit('channelList', channels);
      console.log(`${username} logged in`);
    } else {
      socket.emit('loginError', 'Username is already taken or invalid.');
    }
  });

  socket.on('updateInfo', (newUsername) => {
    const user = users[socket.id];
    if (user && newUsername && !Object.values(users).some(user => user.username === newUsername)) {
      const oldUsername = user.username;
      user.username = newUsername;
      io.emit('userList', Object.values(users).map(user => user.username));
      io.emit('globalMessage', { text: `${oldUsername} a changé son pseudo en ${newUsername}` });
      console.log(`Username updated to ${newUsername}`);
    } else {
      socket.emit('updateError', 'Username is already taken or invalid.');
    }
  });

  socket.on('createChannel', (channelName) => {
    const user = users[socket.id];
    if (user && channelName && !channels.some(channel => channel.name === channelName)) {
      const channel = { name: channelName, creator: socket.id, messages: [], lastActivity: Date.now() };
      channels.push(channel);
      user.ownedChannels.push(channelName);
      io.emit('channelList', channels);
      io.emit('globalMessage', { text: `${user.username} a créé le channel ${channelName}` });
      console.log(`Channel ${channelName} created`);
    } else {
      socket.emit('channelError', 'Channel name is already taken or invalid.');
    }
  });

  socket.on('updateChannel', (oldChannelName, newChannelName) => {
    const channel = channels.find(ch => ch.name === oldChannelName && ch.creator === socket.id);
    if (channel && newChannelName && !channels.some(ch => ch.name === newChannelName)) {
      channel.name = newChannelName;
      io.emit('channelList', channels);
      console.log(`Channel ${oldChannelName} updated to ${newChannelName}`);
    } else {
      socket.emit('channelError', 'New channel name is already taken or invalid.');
    }
  });

  socket.on('deleteChannel', (channelName) => {
    const channelIndex = channels.findIndex(ch => ch.name === channelName && ch.creator === socket.id);
    if (channelIndex !== -1) {
      channels.splice(channelIndex, 1);
      io.emit('channelDeleted', channelName);
      io.emit('channelList', channels);
      io.emit('globalMessage', { text: `${users[socket.id].username} a supprimé le channel ${channelName}` });
      console.log(`Channel ${channelName} deleted`);
    } else {
      socket.emit('channelError', 'Channel not found or you are not the creator.');
    }
  });
  

  socket.on('joinChannel', (channelName) => {
    const channel = channels.find(ch => ch.name === channelName);
    if (channel) {
      socket.join(channelName);
      const user = users[socket.id];
      user.currentChannel = channelName;
      user.joinedChannels.push(channelName);
      userChannels[socket.id].push(channelName);
      const joinMessage = { user: 'System', text: `${user.username} a rejoint le channel` };
      io.to(channelName).emit('newMessage', channelName, joinMessage);
      channel.messages.push(joinMessage);
      channel.lastActivity = Date.now();
      console.log(`${user.username} joined channel ${channelName}`);
    } else {
      socket.emit('channelError', 'Channel inexistant.');
    }
  });

  socket.on('leaveChannel', (channelName) => {
    socket.leave(channelName);
    const user = users[socket.id];
    if (user && userChannels[socket.id].includes(channelName)) {
      userChannels[socket.id] = userChannels[socket.id].filter(c => c !== channelName);
      user.joinedChannels = user.joinedChannels.filter(c => c !== channelName);
      const leaveMessage = { user: 'System', text: `${user.username} a quitté le channel` };
      io.to(channelName).emit('newMessage', channelName, leaveMessage);
      console.log(`${user.username} left channel ${channelName}`);
    } else {
      socket.emit('channelError', 'User not in channel.');
    }
  });

  socket.on('listChannels', (searchTerm) => {
    const filteredChannels = searchTerm
      ? channels.filter(channel => channel.name.includes(searchTerm))
      : channels;
    socket.emit('channelList', filteredChannels);
  });

  socket.on('listUsers', (channelName) => {
    const userList = Object.values(users)
      .filter(user => userChannels[user.id]?.includes(channelName))
      .map(user => user.username);
    socket.emit('userList', userList);
  });

  socket.on('message', ({ channelName, message }) => {
    if (message.startsWith('/')) {
      handleCommand(socket, channelName, message);
      return;
    }
  
    const channel = channels.find(ch => ch.name === channelName);
    const user = users[socket.id];
    if (channel && user && message.trim()) {
      const timestamp = new Date().toISOString();
      const fullMessage = { user: user.username, text: message, timestamp };
      io.to(channelName).emit('newMessage', channelName, fullMessage);
      channel.messages.push(fullMessage); // Store message in channel history
      channel.lastActivity = Date.now();
      console.log(`${user.username} sent message to ${channelName}: ${message}`);
    } else {
      socket.emit('messageError', 'Message is empty or channel/user not found.');
    }
  });
  

  socket.on('privateMessage', ({ to, message }) => {
    const recipient = Object.values(users).find(user => user.username === to);
    const sender = users[socket.id];
    if (recipient && sender) {
      io.to(recipient.id).emit('privateMessage', { from: sender.username, to: recipient.username, message });
      socket.emit('privateMessage', { from: sender.username, to: recipient.username, message });
      console.log(`${sender.username} sent private message to ${recipient.username}: ${message}`);
    } else {
      socket.emit('messageError', 'User not found.');
    }
  });

  socket.on('customDisconnect', () => {
    handleDisconnect(socket);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });

  function handleDisconnect(socket) {
    const user = users[socket.id];
    if (user) {
      user.ownedChannels.forEach(channelName => {
        const channelIndex = channels.findIndex(ch => ch.name === channelName && ch.creator === socket.id);
        if (channelIndex !== -1) {
          channels.splice(channelIndex, 1);
        }
      });
      delete users[socket.id];
      delete userChannels[socket.id];
      io.emit('userList', Object.values(users).map(user => user.username));
      io.emit('channelList', channels);
      console.log(`${user.username} disconnected`);
    }
  }

  function handleCommand(socket, channelName, command) {
    const args = command.split(' ');
    const mainCommand = args[0].toLowerCase();
    const user = users[socket.id];

    switch (mainCommand) {
      case '/nick':
        if (args[1]) {
          const newUsername = args[1];
          const oldUsername = user.username;
          user.username = newUsername;
          io.emit('userList', Object.values(users).map(user => user.username));
          io.emit('globalMessage', { text: `${oldUsername} a changé son pseudo en ${newUsername}` });
          console.log(`Username updated to ${newUsername}`);
        }
        break;
      case '/list':
        const searchTerm = args[1] || '';
        const filteredChannels = channels.filter(channel => channel.name.includes(searchTerm));
        socket.emit('channelList', filteredChannels);
        break;
      case '/create':
        if (args[1]) {
          const channelName = args[1];
          if (!channels.some(channel => channel.name === channelName)) {
            const channel = { name: channelName, creator: socket.id, messages: [], lastActivity: Date.now() };
            channels.push(channel);
            user.ownedChannels.push(channelName);
            io.emit('channelList', channels);
            io.emit('globalMessage', { text: `${user.username} a créé le channel ${channelName}` });
            console.log(`Channel ${channelName} created`);
          } else {
            socket.emit('channelError', 'Channel name is already taken.');
          }
        }
        break;
      case '/delete':
        if (args[1]) {
          const channelName = args[1];
          const channelIndex = channels.findIndex(ch => ch.name === channelName && ch.creator === socket.id);
          if (channelIndex !== -1) {
            channels.splice(channelIndex, 1);
            io.emit('channelList', channels);
            io.emit('globalMessage', { text: `${user.username} a supprimé le channel ${channelName}` });
            console.log(`Channel ${channelName} deleted`);
          } else {
            socket.emit('channelError', 'Channel not found or you are not the creator.');
          }
        }
        break;
      case '/join':
        if (args[1]) {
          const channelName = args[1];
          socket.join(channelName);
          user.currentChannel = channelName;
          user.joinedChannels.push(channelName);
          userChannels[socket.id].push(channelName);
          const joinMessage = { user: 'System', text: `${user.username} a rejoint le channel` };
          io.to(channelName).emit('newMessage', channelName, joinMessage);
          channels.find(ch => ch.name === channelName).messages.push(joinMessage);
          channels.find(ch => ch.name === channelName).lastActivity = Date.now();
          console.log(`${user.username} joined channel ${channelName}`);
        }
        break;
      case '/leave':
        if (user.currentChannel) {
          socket.leave(user.currentChannel);
          const leaveMessage = { user: 'System', text: `${user.username} a quitté le channel` };
          io.to(user.currentChannel).emit('newMessage', user.currentChannel, leaveMessage);
          userChannels[socket.id] = userChannels[socket.id].filter(c => c !== user.currentChannel);
          user.joinedChannels = user.joinedChannels.filter(c => c !== user.currentChannel);
          console.log(`${user.username} left channel ${user.currentChannel}`);
          user.currentChannel = null;
        }
        break;
      case '/users':
        if (user.currentChannel) {
          const userList = Object.values(users)
            .filter(u => userChannels[u.id]?.includes(user.currentChannel))
            .map(u => u.username);
          socket.emit('userList', userList);
        }
        break;
      case '/msg':
        if (args[1] && args.slice(2).join(' ')) {
          const recipient = Object.values(users).find(u => u.username === args[1]);
          if (recipient) {
            const message = args.slice(2).join(' ');
            io.to(recipient.id).emit('privateMessage', { from: user.username, to: recipient.username, message });
            socket.emit('privateMessage', { from: user.username, to: recipient.username, message });
            console.log(`${user.username} sent private message to ${recipient.username}: ${message}`);
          } else {
            socket.emit('messageError', 'User not found.');
          }
        }
        break;
      default:
        socket.emit('messageError', 'Command not found.');
        break;
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
