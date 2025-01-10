import React, { createContext, useContext, useState } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modalState, setModalState] = useState({
        open: false,
        title: '',
        message: '',
        showActionButton: true,
        actionText: '',
        onAction: null,
        showSignInButton: false,
        signInLink: '',
    });

    const showModal = (config) => {
        setModalState({
            title: '',
            message: '',
            showActionButton: true,
            actionText: '',
            onAction: null,
            showSignInButton: false,
            signInLink: '',
            ...config,
            open: true
        });
    };

    const hideModal = () => {
        setModalState({
            ...modalState,
            open: false
        });
    };

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            <Modal
                open={modalState.open}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                actionText={modalState.showActionButton ? modalState.actionText : null}
                onAction={modalState.onAction}
                showSignInButton={modalState.showSignInButton}
                signInLink={modalState.signInLink}
            />
        </ModalContext.Provider>
    );
}

export const useModal = () => useContext(ModalContext);
