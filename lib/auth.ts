// Simple authentication system for demo purposes
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
}

// Sample users database
const users: User[] = [
  {
    id: "1",
    email: "admin@gmail.com",
    name: "Admin User",
    role: "admin",
  },
]

const passwords: Record<string, string> = {
  "admin@gmail.com": "admin@123",
}

export const authenticateUser = (email: string, password: string): User | null => {
  if (passwords[email] === password) {
    return users.find((user) => user.email === email) || null
  }
  return null
}

export const registerUser = (email: string, password: string, name: string): User => {
  const newUser: User = {
    id: Date.now().toString(),
    email,
    name,
    role: "user",
  }
  users.push(newUser)
  passwords[email] = password
  return newUser
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("currentUser")
  return userStr ? JSON.parse(userStr) : null
}

export const setCurrentUser = (user: User | null) => {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
  } else {
    localStorage.removeItem("currentUser")
  }
}
