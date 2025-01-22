import { useFeatureFlag } from 'configcat-react';
import { Navigate } from 'react-router-dom';
function ChatGuard({ children }) {
    const { value: isChatEnabled, loading: isChatEnabledLoading  } = useFeatureFlag("isChatEnabled", false);
    const { value: nextChatStartTime, loading: nextChatStartTimeLoading  } = useFeatureFlag("nextChatStartTime", "");


    if (isChatEnabledLoading || nextChatStartTimeLoading) {
        return <div>Loading...</div>;
    }

    if (!isChatEnabled) {
        return <Navigate to={`/?chat-disabled&next-chat-time=${encodeURIComponent(nextChatStartTime)}`} replace />;
    }

    return children;
}

export default ChatGuard;