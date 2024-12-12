import React, { useState } from 'react';

function ChannelList({
  channels, 
  socket,
  onCreateChannel, 
  onJoinChannel, 
  onUpdateChannel, 
  onDeleteChannel,
  onLeaveChannel
}) {
  const [channelName, setChannelName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateChannel = () => {
    const invalidChars = /[\/>< ]/;
    if (channelName.trim() && !invalidChars.test(channelName)) {
      onCreateChannel(channelName);
      setChannelName('');
      setErrorMessage('');
    } else {
      setErrorMessage("Le nom du channel ne peut pas contenir d'espace, ou /, >, <");
    }
  };

  return (
    <aside className="flex ml-10">       
        <div className="py-8 overflow-y-auto bg-white border-l border-r sm:w-128 w-96 dark:bg-gray-900 dark:border-gray-700
        ">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="px-5 text-3xl font-medium text-gray-800 dark:text-white font-bold">Channel(s)</h2>
              <div>
                <button onClick={handleCreateChannel} className="px-5 py-2">
                  <img src={`${process.env.PUBLIC_URL}/rejoindre.png`} style={{ width: '40px', marginLeft: '20px' }} title="Créer un channel" alt="Créer" />
                </button>
                <button onClick={onLeaveChannel} className="px-5 py-2">
                  <img src={`${process.env.PUBLIC_URL}/quitter_channel.png`} style={{ width: '40px', marginLeft: '10px' }} title="Quitter le channel" alt="Quitter" />
                </button>
              </div>
            </div>
            {errorMessage && <p className="text-red-500 px-5">{errorMessage}</p>}
            <input
              type="text"
              placeholder="Nom du channel"
              value={channelName}
              onChange={(e) => {
                setChannelName(e.target.value);
                setErrorMessage('');
              }}
              className="px-5 py-2 w-full"
            />
            <div className="mt-8 space-y-4 overflow-y-auto" style={{ maxHeight: '200px' }}>
                {channels.map((channel, index) => (
                    <button key={index} className="flex items-center w-full px-5 py-2 transition-colors duration-200 dark:hover:bg-gray-800 gap-x-2 hover:bg-gray-100 focus:outline-none">
                        <div className="text-left rtl:text-right" style={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
                            <h1 className="text-xl font-medium text-gray-700 capitalize dark:text-white">{channel.name}</h1>
                            <div style={{ display: 'flex', justifyContent: 'right', position: 'static' }}>
                              <button onClick={() => onJoinChannel(channel.name)}>
                                <img src={`${process.env.PUBLIC_URL}/join.png`} style={{ width: '30px', marginLeft: '70px' }} title="Rejoindre le channel" alt="Rejoindre" />
                              </button>
                              {channel.creator === socket.id && (
                                <>
                                  <button onClick={() => onUpdateChannel(channel.name)}>
                                    <img src={`${process.env.PUBLIC_URL}/editer.png`} style={{ width: '30px', marginLeft: '30px' }} title="Modifier le nom" alt="Modifier" />
                                  </button>
                                  <button onClick={() => onDeleteChannel(channel.name)}>
                                    <img src={`${process.env.PUBLIC_URL}/supprimer.png`} style={{ width: '30px', marginLeft: '30px' }} title="Supprimer le channel" alt="Supprimer" />
                                  </button>
                                </>
                              )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </aside>
  );
}

export default ChannelList;
