"use client"

import { useState, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  initialQuery?: string
  isLoading?: boolean
}

export function SearchBar({ onSearch, initialQuery = "", isLoading = false }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  const handleClear = () => {
    setValue("")
    onSearch("")
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-tenunara-teal/60" />
          ) : (
            <Search className="h-4 w-4 text-tenunara-teal/60" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cari material, contoh: denim biru grade A 50kg..."
          className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-10 text-sm text-tenunara-charcoal placeholder:text-tenunara-teal/40 focus:border-tenunara-terracotta focus:outline-none focus:ring-1 focus:ring-tenunara-terracotta"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-tenunara-teal/60 hover:text-tenunara-teal"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  )
}
