'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Calendar,
  Users,
  Package,
  FileText,
  Bell,
  Settings,
  Download,
  Upload
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActions() {
  const router = useRouter()

  const handleAction = (action: string) => {
    switch (action) {
      case 'booking':
        router.push('/dashboard/bookings/new')
        break
      case 'customer':
        router.push('/dashboard/customers/new')
        break
      case 'product':
        router.push('/dashboard/inventory/new')
        break
      case 'invoice':
        router.push('/dashboard/financial/invoices/new')
        break
      case 'campaign':
        router.push('/dashboard/marketing/campaigns/new')
        break
      default:
        console.log(`Action ${action} clicked`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Notifications */}
      <Button variant="outline" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      </Button>

      {/* Settings */}
      <Button variant="outline" size="icon">
        <Settings className="h-4 w-4" />
      </Button>

      {/* Export/Import */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Export Data</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <FileText className="h-4 w-4 mr-2" />
            Revenue Report
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Users className="h-4 w-4 mr-2" />
            Customer List
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Calendar className="h-4 w-4 mr-2" />
            Booking History
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Package className="h-4 w-4 mr-2" />
            Inventory Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Add */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Create New</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('booking')}>
            <Calendar className="h-4 w-4 mr-2" />
            New Booking
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('customer')}>
            <Users className="h-4 w-4 mr-2" />
            New Customer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('product')}>
            <Package className="h-4 w-4 mr-2" />
            New Product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('invoice')}>
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('campaign')}>
            <Bell className="h-4 w-4 mr-2" />
            New Campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}