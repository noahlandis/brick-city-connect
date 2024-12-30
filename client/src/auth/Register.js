import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
function Register() {
    const { email } = useLoaderData();
    const [error, setError] = useState('');
    
    return (
        <div className="flex flex-col items-center">
            <div className="card-title text-black justify-center font-helvetica text-2xl ">Sign Up</div>
            <div className="card-body flex flex-col gap-4 w-full ">
                <div className="form-control w-full">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder=""
                            defaultValue={email}
                            value={email}
                            disabled
                            className="input input-bordered bg-white w-full pt-4 text-black peer cursor-not-allowed disabled:bg-white disabled:opacity-100 disabled:border-[#e5e6e6]" 
                        />
                        <label className="absolute text-sm text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                            Email
                        </label>
                    </div>
                    
                    {error && <div className="label">
                        <span className="label-text-alt text-red-700">{error}</span>
                    </div>}
                 
                    <div className="relative mt-4">
                        <input 
                            type="password" 
                            placeholder=""
                            className="input input-bordered bg-white w-full pt-4 text-black peer" 
                        />
                        <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                            Password
                        </label>
                    </div>
                    
                    <div className="relative mt-4">
                        <input 
                            type="password" 
                            placeholder=""
                            className="input input-bordered bg-white w-full pt-4 text-black peer" 
                        />
                        <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                            Confirm Password
                        </label>
                    </div>
                </div>
                
                <button className="btn btn-sm bg-black text-white w-full mt-4">
                    Create Account
                </button>
                
                <p className="text-black text-center mt-4">
                    Already have an account?{' '}
                    <a className="link font-bold text-[#F76902]">Sign in</a>
                </p>
            </div>
        </div>
    );
}

export default Register;