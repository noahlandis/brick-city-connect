import React from 'react';
import { useState } from 'react';


function EmailForm() {
  const [email, setEmail] = useState('');

  async function handleSendVerification() {
    await fetch("http://localhost:3000/send-register-magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // Show a success message
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
