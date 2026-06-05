import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || "",
                    name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
                });
            }
            setIsLoading(false);
        }).catch((err) => {
            console.error("Failed to restore Supabase session:", err);
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || "",
                    name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        console.log('🔐 Attempting login for:', email);
        console.log('🔑 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('🔑 Has publishable key:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('❌ Login error:', error);
            console.error('❌ Error code:', error.status);
            console.error('❌ Error message:', error.message);
            
            // Provide more specific error messages
            if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
                throw new Error('Invalid email or password. Please check your credentials and try again.');
            }
            
            if (error.message.includes('email') && error.message.includes('confirm')) {
                throw new Error('Email not confirmed. Please check your Supabase settings to disable email confirmation, or confirm your email.');
            }
            
            // Throw the original error with more context
            throw new Error(`Authentication failed: ${error.message}`);
        }

        console.log('✅ Login successful for:', data.user?.email);
        
        if (data.user) {
            setUser({
                id: data.user.id,
                email: data.user.email || "",
                name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
            });
        }
    };

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Email confirmation is disabled, so user is automatically logged in
                emailRedirectTo: undefined,
            },
        });

        if (error) throw error;

        // If email confirmation is disabled, data.session will exist and user is logged in
        if (data.session?.user) {
            setUser({
                id: data.session.user.id,
                email: data.session.user.email || "",
                name: data.session.user.user_metadata?.name || data.session.user.email?.split("@")[0],
            });
        } else if (data.user) {
            // Email confirmation enabled (shouldn't happen if disabled, but handle it)
            setUser({
                id: data.user.id,
                email: data.user.email || "",
                name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
            });
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        // Clear any old localStorage data
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, login, signUp, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
