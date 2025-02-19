import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

interface Notification {
  type: string
  from: string
  timestamp: string
  message: string
}

export default function NotificationHandler() {
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('jwtToken')
    const socket = io(`${window.location.origin}/api/notifications`, { auth: { token: `Bearer ${token}` } })

    socket.on("connect", () => {
      console.log("Connected to notifications namespace.")
    })

    socket.on("notification", (data: Notification) => {
      console.log("Notification received:", data)
      setNotificationCount(prev => prev + 1)
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
    </div>
  )
}
