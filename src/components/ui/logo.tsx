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
    small: { width: 24, height: 24, textClass: "text-sm" },
    medium: { width: 32, height: 32, textClass: "text-xl" },
    large: { width: 40, height: 40, textClass: "text-2xl" },
  }

  const { width, height, textClass } = sizes[size]
  
  // Border styles for the bordered variant
  const borderClass = variant === "bordered" 
    ? "rounded-full p-1 bg-black/40 border border-purple-500/50 shadow-lg shadow-purple-500/20" 
    : "";

  return (
    <div className={`flex items-center ${singleLine ? "w-full" : ""} ${className}`}>
      <div className={`relative flex-shrink-0 ${borderClass}`}>
        <Image
          src="/brain-icon-v2.svg?v=2"
          alt="Smart Block AI Logo"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={`font-bold ${textClass} whitespace-nowrap bg-gradient-to-r from-fuchsia-600 via-purple-600 to-rose-500 bg-clip-text text-transparent ml-2`}
        >
          Smart Block AI
        </span>
      )}
    </div>
  )
} 