import Image from "next/image"

interface LogoProps {
  size?: "small" | "medium" | "large"
  showText?: boolean
  className?: string
  variant?: "default" | "bordered"
  singleLine?: boolean
}

export function Logo({ 
  size = "medium", 
  showText = true, 
  className = "",
  variant = "default",
  singleLine = false
}: LogoProps) {
  // Define logo sizes
  const sizes = {
    small: { width: 28, height: 28, textClass: "text-sm" },
    medium: { width: 36, height: 36, textClass: "text-xl" },
    large: { width: 44, height: 44, textClass: "text-2xl" },
  }

  const { width, height, textClass } = sizes[size]
  
  // Border styles for the bordered variant
  const borderClass = variant === "bordered" 
    ? "rounded-full p-1 bg-black/40 border border-purple-500/30 shadow-lg shadow-purple-500/20 filter drop-shadow-md" 
    : "";

  return (
    <div className={`flex items-center ${singleLine ? "w-full" : ""} ${className}`}>
      <div className={`relative flex-shrink-0 ${borderClass}`}>
        <Image
          src="/smart-block-logo.svg"
          alt="Smart Block AI Logo"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={`font-bold ${textClass} whitespace-nowrap bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent ml-2.5`}
        >
          Smart Block AI
        </span>
      )}
    </div>
  )
} 