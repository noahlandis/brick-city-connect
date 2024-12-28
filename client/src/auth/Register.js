import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';

function Register() {
    const { email } = useOutletContext();

    return <div>
        <h1>Register</h1>
        <p>Registering with email: {email}</p>
    </div>
}

export default Register;