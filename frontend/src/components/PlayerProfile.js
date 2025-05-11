import React from 'react';

const PlayerProfile = ({ profile }) => {
  if (!profile) {
    return <p>No profile data available.</p>;
  }

  return (
    <div style={{ margin: '20px auto', maxWidth: '600px' }}>
      <h2>Player Profile</h2>
      <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        {JSON.stringify(profile, null, 2)}
      </pre>
    </div>
  );
};

export default PlayerProfile;
