import { useLoaderData } from 'react-router-dom';
function Register() {
    const { email } = useLoaderData();

    return <div>
        <h1>Register</h1>
        <p>Registering with email: {email}</p>
    </div>
}

export default Register;