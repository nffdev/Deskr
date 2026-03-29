import { useState, useMemo, createContext } from "react";

export const UserContext = createContext({
    user: null,
    updateUser: () => {}
});

export function UserContextProvider({ children }) {
    const [user, setUser] = useState(null);
    const updateUser = useMemo(() => (data) => setUser(data), []);
        
    return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>;
}