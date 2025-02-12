// NotificationHandler.tsx
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

interface Notification {
  type: string
  from: string
  timestamp: string
  message: string
}

interface Toast extends Notification {
  id: number
}

export default function NotificationHandler() {
  const [notificationCount, setNotificationCount] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const token = localStorage.getItem('jwtToken')
    const socket = io("ws://localhost:3000/api/notifications", { auth: { token: `Bearer ${token}` } })

    socket.on("connect", () => {
      console.log("Connected to notifications namespace.")
    })

    socket.on("notification", (data: Notification, ack: Function) => {
      console.log("Notification received:", data)
      setNotificationCount(prev => prev + 1)
      const newToast: Toast = { ...data, id: Date.now() }
      setToasts(prev => [...prev, newToast])
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== newToast.id))
      }, 5000)
      if (typeof ack === "function") {
        ack("Notification received")
      }
    })

    socket.on("error", (error: any) => {
      console.error("Notification error:", error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <i className="bi-bell-fill" style={{ fontSize: "1.5rem" }}></i>
      {notificationCount > 0 && (
        <span style={{
          position: "absolute",
          top: -5,
          right: -5,
          backgroundColor: "red",
          color: "white",
          borderRadius: "50%",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem"
        }}>
          {notificationCount}
        </span>
      )}
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            marginBottom: "10px",
            padding: "10px 20px",
            backgroundColor: "#333",
            color: "#fff",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0, 83, 138, 0.3)",
            minWidth: "200px",
            opacity: 0.9,
          }}>
            <div><strong>{toast.type}</strong></div>
            <div>{toast.message}</div>
            <div style={{ fontSize: "0.75rem", marginTop: "5px" }}>
              {/* {new Date(toast.timestamp).toLocaleTimeString()} */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
