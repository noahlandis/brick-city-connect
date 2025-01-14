import { GoogleLogin } from '@react-oauth/google';
import { googleCallback } from '../api/authApi';
function GoogleOAuth({ text }) {
    
    const handleSuccess = async (successResponse) => {
        console.log("handle success called");
        const response = await googleCallback(successResponse.credential);
    };

    return (
        <div className="flex justify-center mt-6" style={{ width: '100%' }}>
            <GoogleLogin 
                hosted_domain="rit.edu" 
                onSuccess={handleSuccess} 
                onError={() => {console.log('hi')}} 
                text={text}
                width="100%"
            />
        </div>
    );  
}

export default GoogleOAuth;