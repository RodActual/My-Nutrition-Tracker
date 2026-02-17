'use client';

export default function UserSwitcher({ onSelect }) {
  const users = [
    { id: 'anthony_uid', name: 'Anthony' },
    { id: 'madison_uid', name: 'Madison' }
  ];

  const handleSelect = (userId) => {
    localStorage.setItem('selectedUser', userId);
    onSelect(userId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8">Who is tracking today?</h1>
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleSelect(user.id)}
            className="bg-white p-6 rounded-2xl shadow-sm text-xl font-semibold hover:bg-blue-50 transition border-2 border-transparent hover:border-blue-400"
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
}