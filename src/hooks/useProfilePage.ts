
import { useEffect, useReducer } from 'react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useUpdateProfile, useChangePassword } from '@/api/auth';
import { toast } from 'sonner';
import { validatePassword } from '@/services/profile.service';

const initialState = {
    showPasswordDialog: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    passwordError: '',
    isEditing: false,
    formData: {
        name: '',
        email: '',
        phone: '',
    },
    activeTab: 'personal',
};

type State = typeof initialState;

type Action =
    | { type: 'SET_SHOW_PASSWORD_DIALOG'; payload: boolean }
    | { type: 'SET_CURRENT_PASSWORD'; payload: string }
    | { type: 'SET_NEW_PASSWORD'; payload: string }
    | { type: 'SET_CONFIRM_PASSWORD'; payload: string }
    | { type: 'SET_PASSWORD_ERROR'; payload: string }
    | { type: 'SET_IS_EDITING'; payload: boolean }
    | { type: 'SET_FORM_DATA'; payload: Partial<State['formData']> }
    | { type: 'SET_ACTIVE_TAB'; payload: string }
    | { type: 'RESET_FORM'; payload: State['formData'] }
    | { type: 'RESET_PASSWORD_FORM' };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_SHOW_PASSWORD_DIALOG':
            return { ...state, showPasswordDialog: action.payload };
        case 'SET_CURRENT_PASSWORD':
            return { ...state, currentPassword: action.payload };
        case 'SET_NEW_PASSWORD':
            return { ...state, newPassword: action.payload };
        case 'SET_CONFIRM_PASSWORD':
            return { ...state, confirmPassword: action.payload };
        case 'SET_PASSWORD_ERROR':
            return { ...state, passwordError: action.payload };
        case 'SET_IS_EDITING':
            return { ...state, isEditing: action.payload };
        case 'SET_FORM_DATA':
            return { ...state, formData: { ...state.formData, ...action.payload } };
        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };
        case 'RESET_FORM':
            return { ...state, isEditing: false, formData: action.payload };
        case 'RESET_PASSWORD_FORM':
            return {
                ...state,
                showPasswordDialog: false,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                passwordError: '',
            };
        default:
            return state;
    }
};

export const useProfilePage = () => {
    const { user, loading, error, initAuth } = useAuthStore();
    const updateProfileMutation = useUpdateProfile();
    const changePasswordMutation = useChangePassword();
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        if (!user) {
            initAuth();
        } else {
            dispatch({
                type: 'SET_FORM_DATA',
                payload: {
                    name: user.staff.name || '',
                    email: user.username || '',
                    phone: user.staff.phone || '',
                },
            });
        }
    }, [user, initAuth]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfileMutation.mutateAsync(state.formData);
            dispatch({ type: 'SET_IS_EDITING', payload: false });
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error('Failed to update profile');
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'SET_PASSWORD_ERROR', payload: '' });

        if (state.newPassword !== state.confirmPassword) {
            dispatch({ type: 'SET_PASSWORD_ERROR', payload: 'New passwords do not match' });
            return;
        }

        const passwordError = validatePassword(state.newPassword);
        if (passwordError) {
            dispatch({ type: 'SET_PASSWORD_ERROR', payload: passwordError });
            return;
        }

        try {
            await changePasswordMutation.mutateAsync({
                currentPassword: state.currentPassword,
                newPassword: state.newPassword,
            });
            dispatch({ type: 'RESET_PASSWORD_FORM' });
            toast.success('Password changed successfully');
        } catch (err) {
            dispatch({ type: 'SET_PASSWORD_ERROR', payload: 'Failed to change password' });
        }
    };

    const cancelEdit = () => {
        if (user) {
            dispatch({
                type: 'RESET_FORM',
                payload: {
                    name: user.staff.name || '',
                    email: user.username || '',
                    phone: user.staff.phone || '',
                },
            });
        }
    };

    return {
        user,
        loading,
        error,
        ...state,
        dispatch,
        updateProfileMutation,
        changePasswordMutation,
        handleProfileUpdate,
        handlePasswordChange,
        cancelEdit,
        initAuth
    };
};
