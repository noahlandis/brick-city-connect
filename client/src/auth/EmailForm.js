import React from 'react';
import { useState } from 'react';
import { sendRegisterMagicLink } from '../api/registerMagicLinkApi';

function EmailForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function handleSendVerification() {
    setError('');
    try {
      await sendRegisterMagicLink(email);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Something went wrong';
      console.log("the error is", errorMessage);
      setError(errorMessage);
    }
  }

    return (
        <div>
            <div className="card-title text-white justify-center font-helvetica">Sign up with email</div>
            <div className="card-body">
                <label className="input input-bordered bg-white flex items-center gap-2 text-black" onChange={(e) => setEmail(e.target.value)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        class="h-4 w-4 opacity-70">
                        <path
                            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path
                            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                    </svg>
                    <input type="text" className="grow input-error" placeholder="user@rit.edu" />
                </label>
                <button className="btn btn-sm bg-black text-white" onClick={handleSendVerification}>Continue</button>
                <p className="mt-4 text-white">
                Already have an account?{' '}
                <a className="link font-bold">Sign in</a>
                </p>
            </div>
        </div>

    );
}

export default EmailForm;
