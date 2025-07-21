import type { ReactNode } from "react"
import Footer from "./footer"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface-primary">
      <main className="">{children}</main>
      <Footer />
    </div>
  )
}
