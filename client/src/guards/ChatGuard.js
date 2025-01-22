import { useFeatureFlag } from 'configcat-react';

function ChatGuard({ children }) {
    const { value: isChatEnabled, loading: isChatEnabledLoading  } = useFeatureFlag("isChatEnabled", false);

    if (isChatEnabledLoading) {
        return <div>Loading...</div>;
    }

    if (!isChatEnabled) {
        return <div>You are not allowed to access this page yet. Come back later! please</div>;
    }

    return children;
}

export default ChatGuard;