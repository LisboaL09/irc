import React, { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    const trimmedUsername = username.trim(); // retire les espaces en début et fin
    const isValidUsername = /^[A-Za-z0-9_]+$/.test(trimmedUsername);
  
    if (trimmedUsername && isValidUsername) {
      onLogin(trimmedUsername);
      setErrorMessage('');
    } else {
      setErrorMessage("Le pseudo ne doit contenir que des lettres, des chiffres et des underscores."); 
    }
  };

  return (

    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="w-full max-w-md">
        <form className="bg-white shadow-lg rounded-lg px-10 pt-8 pb-8 mb-4">
          <span className="text-3xl block mb-8">Bienvenue sur notre IRC</span>
          <div>
            <input
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
              "
              type="text" placeholder="Votre pseudo" value={username} onChange={(e) => setUsername(e.target.value)}
            />
            {errorMessage && <p className="text-red-500 text-s italic">{errorMessage}</p>}
          </div>
          <div className="mt-10 ml-24">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline text-lg"
              type="button"
              onClick={handleLogin}
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;