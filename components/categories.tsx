import { Apple, Carrot, Milk, Cookie, Coffee, Beef } from "lucide-react"

const categories = [
  { name: "Fruits", icon: Apple, color: "bg-red-100 text-red-600" },
  { name: "Vegetables", icon: Carrot, color: "bg-green-100 text-green-600" },
  { name: "Dairy", icon: Milk, color: "bg-blue-100 text-blue-600" },
  { name: "Snacks", icon: Cookie, color: "bg-yellow-100 text-yellow-600" },
  { name: "Beverages", icon: Coffee, color: "bg-purple-100 text-purple-600" },
  { name: "Meat", icon: Beef, color: "bg-pink-100 text-pink-600" },
]

export default function Categories() {
  return (
    <section className="bg-surface-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Shop by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <button
                key={category.name}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-surface-hover transition duration-200 group"
              >
                <div
                  className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}
                >
                  <IconComponent size={32} />
                </div>
                <span className="text-sm font-medium text-text-primary">{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
