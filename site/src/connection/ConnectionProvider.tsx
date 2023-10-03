import React, { createContext, useEffect } from "react"
import { io, Socket } from "socket.io-client"

type ConnectionContextType = {
    connected: boolean
    connection: Socket
}

const connectionContext = createContext<ConnectionContextType>(null)

export const ConnectionProvider = ({ children }) => {
    const url = window.location.hostname === "localhost" ? "http://10.10.0.2:3000" : "/"
    console.log("Connecting to", url)
    const socket: Socket = io(url)
    const [connected, setConnected] = React.useState(false)

    useEffect(() => {
        function connected() {
            setConnected(true)
        }
        function disconnected() {
            setConnected(false)
        }
        socket.on("connect", connected)
        socket.on("disconnect", disconnected)
        return () => {
            socket.off("connect", connected)
            socket.off("disconnect", disconnected)
        }
    }, [])

    return (
        <connectionContext.Provider value={{ connected, connection: socket }}>
            {children}
        </connectionContext.Provider>
    )
}

export const useConnection = () => {
    const context = React.useContext(connectionContext)
    if (!context) {
        throw new Error("No connection context")
    }
    return context
}
