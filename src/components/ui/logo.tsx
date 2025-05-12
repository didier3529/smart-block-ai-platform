import Image from "next/image"

interface LogoProps {
  size?: "small" | "medium" | "large"
  showText?: boolean
  className?: string
}

export function Logo({ size = "medium", showText = true, className = "" }: LogoProps) {
  // Define logo sizes
  const sizes = {
    small: { width: 24, height: 24, textClass: "text-sm" },
    medium: { width: 32, height: 32, textClass: "text-xl" },
    large: { width: 40, height: 40, textClass: "text-2xl" },
  }

  const { width, height, textClass } = sizes[size]

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex-shrink-0">
        <Image
          src="/images/smartblockAI-logo.png"
          alt="SmartBlockAI Logo"
          width={width}
          height={height}
          className="object-contain"
        />
      </div>
      {showText && (
        <span
          className={`ml-2 font-bold ${textClass} bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent`}
        >
          SmartBlockAI
        </span>
      )}
    </div>
  )
} 