'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    date || {
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    }
  )
  const [isOpen, setIsOpen] = React.useState(false)
  const [fromValue, setFromValue] = React.useState('')
  const [toValue, setToValue] = React.useState('')

  React.useEffect(() => {
    if (dateRange?.from) {
      setFromValue(format(dateRange.from, 'yyyy-MM-dd'))
    }
    if (dateRange?.to) {
      setToValue(format(dateRange.to, 'yyyy-MM-dd'))
    }
  }, [dateRange])

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value ? new Date(e.target.value) : undefined
    const newRange = { ...dateRange, from: newFrom }
    setDateRange(newRange as DateRange)
    onDateChange?.(newRange as DateRange)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value ? new Date(e.target.value) : undefined
    const newRange = { ...dateRange, to: newTo }
    setDateRange(newRange as DateRange)
    onDateChange?.(newRange as DateRange)
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={'outline'}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-[260px] justify-start text-left font-normal',
          !dateRange && 'text-muted-foreground'
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {dateRange?.from ? (
          dateRange.to ? (
            <>
              {format(dateRange.from, 'LLL dd, y')} -{' '}
              {format(dateRange.to, 'LLL dd, y')}
            </>
          ) : (
            format(dateRange.from, 'LLL dd, y')
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-50 w-auto rounded-md border bg-background p-4 shadow-md">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  value={fromValue}
                  onChange={handleFromChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  value={toValue}
                  onChange={handleToChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateRange(undefined)
                  onDateChange?.(undefined)
                  setIsOpen(false)
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}