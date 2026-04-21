import { useState, useEffect } from 'react'
import { WEDDING_DATE } from '../constants/weddingInfo'

function getTimeRemaining() {
  const total = WEDDING_DATE - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
    expired: false,
  }
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-3 min-w-[70px]">
      <span className="font-serif text-5xl md:text-7xl text-palmetto tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="font-sans text-xs tracking-[0.25em] uppercase text-sage">
        {label}
      </span>
    </div>
  )
}

export default function CountdownTimer() {
  const [time, setTime] = useState(getTimeRemaining)

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeRemaining()), 1000)
    return () => clearInterval(id)
  }, [])

  if (time.expired) {
    return (
      <p className="font-serif text-palmetto text-3xl italic">Today is the day!</p>
    )
  }

  return (
    <div className="flex items-start justify-center gap-6 md:gap-12">
      <TimeUnit value={time.days} label="Days" />
      <span className="font-serif text-4xl text-sage/30 leading-none mt-2">·</span>
      <TimeUnit value={time.hours} label="Hours" />
      <span className="font-serif text-4xl text-sage/30 leading-none mt-2">·</span>
      <TimeUnit value={time.minutes} label="Minutes" />
      <span className="font-serif text-4xl text-sage/30 leading-none mt-2">·</span>
      <TimeUnit value={time.seconds} label="Seconds" />
    </div>
  )
}
