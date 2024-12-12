import React from 'react';

function UserList({ users, currentUsername, onLogout }) {
  return (
    <div class="max-w-2xl mr-10">
      <div class="p-4 max-w-md bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700
      ">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-3xl font-bold leading-none text-gray-900 dark:text-white">Utilisateur(s) en ligne</h3>
          <button onClick={onLogout} style={{ background: 'transparent', border: 'none' }}>
            <img src={`${process.env.PUBLIC_URL}/logout.png`} style={{ width: '30px', marginLeft: '20px' }} title="Se déconnecter"/>
          </button>
        </div>
        <div class="flow-root overflow-y-auto" style={{ maxHeight:'200px'}}>
          <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user, index) => (
              <li key={index} class="py-3 sm:py-4">
                <div class="flex items-center space-x-4">
                  <div class="flex-1 min-w-0">
                    <p class={`text-xl font-medium text-gray-900 truncate dark:text-white ${user === currentUsername ? 'font-bold' : ''}`}>
                      {user} {user === currentUsername && "(Vous)"}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserList;