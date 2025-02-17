import React from 'react';
import { useAuth } from "@/lib/hooks/useAuth";

export default function News() {
    const { user } = useAuth();

    return (
        <div className="flex flex-col h-screen">
            <p>Welcome {user.username}</p>
        </div>
    );
}
