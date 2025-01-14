import { GoogleLogin } from '@react-oauth/google';
import { Divider } from '@mui/material';

function GoogleOAuth({ text }) {
    return (
        <div className="flex justify-center mt-6" style={{ width: '100%' }}>
            <GoogleLogin 
                hosted_domain="rit.edu" 
                onSuccess={() => {console.log('hi')}} 
                onError={() => {console.log('hi')}} 
                text={text}
                width="100%"
            />
        </div>
    );  
}

export default GoogleOAuth;