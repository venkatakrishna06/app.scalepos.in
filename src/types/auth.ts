import {StaffMember} from "@/types/index.ts";

export interface User {
    id: number;
    email: string;
    name: string;
    avatar_url?: string;
    phone?: string;
    role: 'admin' | 'manager' | 'kitchen' | 'server' | 'staff' | 'user';
    created_at: string;
    staff_id?: number;
    staff?: StaffMember;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    restaurant_name: string;
    restaurant_address?: string;
    restaurant_phone?: string;
    restaurant_email?: string;
    restaurant_gst?: string;
}

export interface AuthResponse {
    user_account: User | null | undefined;
    user: User;
    token: string;
    refreshToken?: string;
}
