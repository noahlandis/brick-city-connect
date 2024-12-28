import React from 'react';
import { useState } from 'react';
import { sendRegisterMagicLink } from '../api/registerMagicLinkApi';

function EmailForm() {
  const [email, setEmail] = useState('');

  async function handleSendVerification() {
    await sendRegisterMagicLink(email);
  }

  return (
    <div>
        Enter an Email
        <input
        type="email"
        placeholder="RIT Email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        />
        <button onClick={handleSendVerification}>Verify Email</button>

    </div>
    
  );
}

export default EmailForm;
