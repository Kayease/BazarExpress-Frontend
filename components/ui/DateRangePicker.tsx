"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void
  placeholder?: string
  className?: string
}

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onDateRangeChange, 
  placeholder = "Select date range",
  className = ""
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate)
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate)
  
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
  }, [startDate, endDate])

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date, 'Current tempStartDate:', tempStartDate, 'Current tempEndDate:', tempEndDate)
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // First click or reset selection
      console.log('First click or reset - setting start date to:', date)
      setTempStartDate(date)
      setTempEndDate(null)
    } else {
      // Second click - set end date
      console.log('Second click - setting end date to:', date)
      let finalStartDate: Date
      let finalEndDate: Date
      
      if (date < tempStartDate) {
        finalStartDate = date
        finalEndDate = tempStartDate
        console.log('End date is before start date, swapping:', { finalStartDate, finalEndDate })
        setTempStartDate(date)
        setTempEndDate(tempStartDate)
      } else {
        finalStartDate = tempStartDate
        finalEndDate = date
        console.log('End date is after start date:', { finalStartDate, finalEndDate })
        setTempEndDate(date)
      }
      
      // Automatically apply the date range when both dates are selected
      console.log('Auto-applying date range:', { start: finalStartDate, end: finalEndDate })
      onDateRangeChange(finalStartDate, finalEndDate)
      setIsOpen(false)
    }
  }

  const handleApply = () => {
    // Only apply if both dates are selected
    if (tempStartDate && tempEndDate) {
      console.log('Manually applying date range:', { start: tempStartDate, end: tempEndDate })
      onDateRangeChange(tempStartDate, tempEndDate)
      setIsOpen(false)
    } else {
      console.log('Cannot apply: missing dates', { start: tempStartDate, end: tempEndDate })
    }
  }

  const handleClear = () => {
    console.log('Clearing date range')
    setTempStartDate(null)
    setTempEndDate(null)
    onDateRangeChange(null, null)
    setIsOpen(false)
  }

  const isInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false
    return isWithinInterval(date, { start: startOfDay(tempStartDate), end: endOfDay(tempEndDate) })
  }

  const isStartDate = (date: Date) => tempStartDate && isSameDay(date, tempStartDate)
  const isEndDate = (date: Date) => tempEndDate && isSameDay(date, tempEndDate)

  const getDisplayText = () => {
    if (!startDate && !endDate) return placeholder
    if (startDate && !endDate) return `From ${format(startDate, 'MMM dd, yyyy')} - Select end date`
    if (startDate && endDate) return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
    return placeholder
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return (
      <div className="w-64">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = isStartDate(day) || isEndDate(day)
              const isInSelectedRange = isInRange(day)
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  onMouseEnter={() => setHoveredDate(day)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={!isCurrentMonth}
                  className={`
                    w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors
                    ${!isCurrentMonth ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100 cursor-pointer'}
                    ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isInSelectedRange && !isSelected ? 'bg-blue-100 text-blue-700' : ''}
                    ${hoveredDate && isCurrentMonth && !isSelected && !isInSelectedRange ? 'bg-gray-50' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100"
          >
            Clear
          </button>
          <div className="flex items-center space-x-2">
            {tempStartDate && !tempEndDate && (
              <span className="text-xs text-orange-600">Select end date</span>
            )}
            {tempStartDate && tempEndDate && (
              <span className="text-xs text-green-600">Range selected</span>
            )}
            <button
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer hover:border-gray-400 transition-colors h-10"
      >
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={startDate || endDate ? 'text-gray-900' : 'text-gray-500'}>
            {getDisplayText()}
          </span>
        </div>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
          {renderCalendar()}
        </div>
      )}
    </div>
  )
}
