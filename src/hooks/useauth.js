import { useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase.js';

const googleProvider = new GoogleAuthProvider();

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    async function register(name, email, password) {
        try {
            setError(null);
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: name });
            setUser({ ...credential.user, displayName: name });
            return true;
        } catch (err) {
            setError(translateError(err.code));
            return false;
        }
    }

    async function login(email, password) {
        try {
            setError(null);
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (err) {
            setError(translateError(err.code));
            return false;
        }
    }

    async function loginWithGoogle() {
        try {
            setError(null);
            await signInWithPopup(auth, googleProvider);
            return true;
        } catch (err) {
            setError(translateError(err.code));
            return false;
        }
    }

    async function logout() {
        await signOut(auth);
    }

    function translateError(code) {
        const errors = {
            'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/invalid-credential': 'E-mail ou senha incorretos.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
            'auth/popup-closed-by-user': 'Login cancelado.',
        };
        return errors[code] || 'Ocorreu um erro. Tente novamente.';
    }

    return {
        user,
        loading,
        error,
        setError,
        register,
        login,
        loginWithGoogle,
        logout
    };
}
