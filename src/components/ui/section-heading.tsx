import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  title: string
  description?: string
  align?: "left" | "center" | "right"
  titleClassName?: string
  descriptionClassName?: string
  gradientText?: "purple" | "blue" | "teal" | "orange" | "default"
}

export function SectionHeading({
  title,
  description,
  align = "center",
  titleClassName,
  descriptionClassName,
  gradientText = "default",
}: SectionHeadingProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  const getGradientClass = () => {
    switch (gradientText) {
      case "purple":
        return "gradient-text-purple"
      case "blue":
        return "gradient-text-blue"
      case "teal":
        return "gradient-text-blue"
      case "orange":
        return "gradient-text-orange"
      default:
        return "gradient-text"
    }
  }

  return (
    <div className={cn("mb-12", alignClass[align])}>
      <div className="inline-block relative">
        <h2 className={cn("text-4xl md:text-5xl font-bold mb-3", getGradientClass(), titleClassName)}>{title}</h2>
        <div className="h-1 w-1/2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto mt-3" />
      </div>
      {description && (
        <p className={cn("text-xl text-gray-300 max-w-2xl mx-auto mt-6", descriptionClassName)}>{description}</p>
      )}
    </div>
  )
} 