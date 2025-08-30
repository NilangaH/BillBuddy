
'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { DateRange } from "react-day-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, Plus, Upload, ShieldAlert, UserPlus, KeyRound, User as UserIcon, Calculator, Printer, Calendar as CalendarIcon, FilterX, Mail, MessageSquareText } from 'lucide-react';
import type { Settings, ServiceChargeRule, UtilityLogos, Utility, UtilityPaymentLinks, ShopDetails, User, UserRole, PrintSize, Payment } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/config';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  currentSettings: Settings;
  allPayments: Payment[];
  onClearHistory: (startDate?: Date, endDate?: Date, selectedMonth?: string) => void;
}

export function SettingsDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  currentSettings,
  allPayments,
  onClearHistory,
}: SettingsDialogProps) {
  const { toast } = useToast();
  const [logos, setLogos] = useState<UtilityLogos>(DEFAULT_SETTINGS.logos);
  const [paymentLinks, setPaymentLinks] = useState<UtilityPaymentLinks>(DEFAULT_SETTINGS.paymentLinks);
  const [rules, setRules] = useState<ServiceChargeRule[]>(DEFAULT_SETTINGS.serviceCharges);
  const [shopDetails, setShopDetails] = useState<ShopDetails>(DEFAULT_SETTINGS.shopDetails);
  const [users, setUsers] = useState<User[]>(DEFAULT_SETTINGS.users);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as UserRole });
  const [showBalanceCalculator, setShowBalanceCalculator] = useState<boolean>(false);
  const [printSize, setPrintSize] = useState<PrintSize>('A5');
  const [sendSmsOnConfirm, setSendSmsOnConfirm] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  useEffect(() => {
    if (isOpen && currentSettings) {
      setLogos(currentSettings.logos || DEFAULT_SETTINGS.logos);
      setPaymentLinks(currentSettings.paymentLinks || DEFAULT_SETTINGS.paymentLinks);
      setRules(currentSettings.serviceCharges || DEFAULT_SETTINGS.serviceCharges);
      setShopDetails(currentSettings.shopDetails || DEFAULT_SETTINGS.shopDetails);
      setUsers(currentSettings.users || DEFAULT_SETTINGS.users);
      setShowBalanceCalculator(currentSettings.showBalanceCalculator || false);
      setPrintSize(currentSettings.printSize || DEFAULT_SETTINGS.printSize);
      setSendSmsOnConfirm(currentSettings.sendSmsOnConfirm || false);
      setDateRange(undefined);
      setSelectedMonth('all');
    }
  }, [isOpen, currentSettings]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allPayments.forEach(p => {
      months.add(format(parseISO(p.date), 'yyyy-MM'));
    });
    return Array.from(months).sort().reverse();
  }, [allPayments]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, callback: (dataUri: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          callback(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (utility: Utility, value: string) => {
    setLogos(prev => ({ ...prev, [utility]: value }));
  };
  
  const handleShopDetailChange = (field: keyof ShopDetails, value: string) => {
    setShopDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleLinkChange = (utility: Utility, value: string) => {
    setPaymentLinks(prev => ({ ...prev, [utility]: value }));
  };

  const handleRuleChange = (index: number, field: keyof ServiceChargeRule, value: any) => {
    const newRules = [...rules];
    (newRules[index] as any)[field] = value;
    setRules(newRules);
  };
  
  const handleAddNewRule = () => {
    const newRule: ServiceChargeRule = {
      id: `rule-${Date.now()}`,
      min: 0,
      max: null,
      value: 0,
      type: 'fixed',
    };
    setRules([...rules, newRule]);
  };
  
  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };
  
  const handleNewUserChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };
  
  const handleAddNewUser = () => {
    if (newUser.username && newUser.password && !users.find(u => u.username === newUser.username)) {
      const userToAdd: User = {
        id: `user-${Date.now()}`,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
      };
      setUsers([...users, userToAdd]);
      setNewUser({ username: '', password: '', role: 'user' });
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (users.length <= 1) {
      alert("You cannot delete the last user.");
      return;
    }
    setUsers(users.filter(u => u.id !== userId));
  }

  const handleSave = () => {
     const finalSettings: Settings = {
        logos,
        paymentLinks,
        serviceCharges: rules,
        shopDetails,
        users,
        showBalanceCalculator,
        printSize,
        sendSmsOnConfirm,
    };
    onSave(finalSettings);
    onClose();
  };

  const handleDateRangeClear = () => {
    if (dateRange?.from && dateRange?.to) {
        onClearHistory(dateRange.from, dateRange.to);
        setDateRange(undefined);
    }
  }

  const handleMonthClear = () => {
    if (selectedMonth && selectedMonth !== 'all') {
        onClearHistory(undefined, undefined, selectedMonth);
        setSelectedMonth('all');
    }
  }
  
  const resetFilters = () => {
    setDateRange(undefined);
    setSelectedMonth('all');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Manage shop details, logos, payment links, service charges, users and data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto -mx-6 px-6">
            <Tabs defaultValue="shop" className="mt-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="shop">Shop</TabsTrigger>
                <TabsTrigger value="logos">Logos</TabsTrigger>
                <TabsTrigger value="payment-links">Links</TabsTrigger>
                <TabsTrigger value="service-charges">Charges</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>
              <TabsContent value="shop" className="py-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shop-name">Shop Name</Label>
                      <Input
                        id="shop-name"
                        value={shopDetails.shopName}
                        onChange={e => handleShopDetailChange('shopName', e.target.value)}
                        placeholder="e.g., Bill Buddy"
                      />
                    </div>
                     <div className="space-y-2">
                      <Label>Shop Logo</Label>
                      <div className="flex items-center gap-4">
                        <Image src={shopDetails.logo} alt="Shop Logo Preview" width={40} height={40} className="rounded-full bg-muted" />
                        <Input
                          id="shop-logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, (dataUri) => handleShopDetailChange('logo', dataUri))}
                        />
                        <Button asChild variant="outline">
                          <Label htmlFor="shop-logo-upload" className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Label>
                        </Button>
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="shop-address">Shop Address</Label>
                      <Input
                        id="shop-address"
                        value={shopDetails.address}
                        onChange={e => handleShopDetailChange('address', e.target.value)}
                        placeholder="123 Main St, Anytown"
                      />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="shop-phone">Shop Phone Number</Label>
                      <Input
                        id="shop-phone"
                        value={shopDetails.phoneNo}
                        onChange={e => handleShopDetailChange('phoneNo', e.target.value)}
                        placeholder="012-3456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shop-email">Shop Email</Label>
                       <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="shop-email"
                          value={shopDetails.email || ''}
                          onChange={e => handleShopDetailChange('email', e.target.value)}
                          placeholder="shop@example.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="p-4 border rounded-md space-y-4">
                        <h4 className="font-semibold flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Feature Settings</h4>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <Label>Show Balance Calculator</Label>
                            <p className="text-xs text-muted-foreground">
                              Enable a tool to calculate change in the payment confirmation window.
                            </p>
                          </div>
                          <Switch
                            checked={showBalanceCalculator}
                            onCheckedChange={setShowBalanceCalculator}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="flex items-center gap-2"><MessageSquareText className="h-4 w-4" /> Send SMS on Confirm</Label>
                            <p className="text-xs text-muted-foreground">
                              Automatically open the SMS app with receipt details after printing.
                            </p>
                          </div>
                          <Switch
                            checked={sendSmsOnConfirm}
                            onCheckedChange={setSendSmsOnConfirm}
                          />
                        </div>
                    </div>
                    <div className="p-4 border rounded-md space-y-4">
                        <h4 className="font-semibold flex items-center gap-2"><Printer className="h-5 w-5 text-primary" /> Print Settings</h4>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>Default Paper Size</Label>
                            <Select value={printSize} onValueChange={(value: PrintSize) => setPrintSize(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select paper size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A5">A5</SelectItem>
                                    <SelectItem value="80mm">80mm Thermal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
              </TabsContent>
              <TabsContent value="logos" className="py-4">
                <div className="space-y-4">
                  {(Object.keys(logos) as Utility[]).map(utility => (
                    <div key={utility} className="space-y-2">
                      <Label>{utility} Logo</Label>
                      <div className="flex items-center gap-4">
                        <Image src={logos[utility]} alt={`${utility} Logo Preview`} width={40} height={40} className="rounded-full bg-muted" />
                         <Input
                          id={`logo-upload-${utility}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, (dataUri) => handleLogoChange(utility, dataUri))}
                        />
                        <Button asChild variant="outline">
                          <Label htmlFor={`logo-upload-${utility}`} className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Label>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
               <TabsContent value="payment-links" className="py-4">
                <div className="space-y-4">
                  {(Object.keys(paymentLinks || {}) as Utility[]).map(utility => (
                    <div key={utility} className="space-y-2">
                      <Label htmlFor={`link-${utility}`}>{utility} Payment URL</Label>
                      <Input
                        id={`link-${utility}`}
                        value={paymentLinks[utility]}
                        onChange={e => handleLinkChange(utility, e.target.value)}
                        placeholder="https://example.com/pay"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="service-charges" className="py-4">
                <div className="space-y-4">
                  <Label>Service Charge Rules</Label>
                  {rules.map((rule, index) => (
                    <div key={rule.id} className="grid grid-cols-3 gap-2 p-2 border rounded-md items-center">
                       <div className="col-span-3 grid grid-cols-2 gap-2">
                         <div>
                            <Label htmlFor={`min-${index}`} className="text-xs">Min Amount</Label>
                            <Input
                              id={`min-${index}`}
                              type="number"
                              value={rule.min}
                              onChange={e => handleRuleChange(index, 'min', e.target.valueAsNumber)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max-${index}`} className="text-xs">Max Amount</Label>
                            <Input
                              id={`max-${index}`}
                              type="number"
                              placeholder="None"
                              value={rule.max === null ? '' : rule.max}
                              onChange={e => handleRuleChange(index, 'max', e.target.value === '' ? null : e.target.valueAsNumber)}
                            />
                          </div>
                       </div>
                       <div className="col-span-2">
                         <Label htmlFor={`value-${index}`} className="text-xs">Charge Value</Label>
                        <Input
                          id={`value-${index}`}
                          type="number"
                          value={rule.value}
                          onChange={e => handleRuleChange(index, 'value', e.target.valueAsNumber)}
                        />
                      </div>
                       <div className="flex items-end h-full gap-2">
                        <select
                            value={rule.type}
                            onChange={e => handleRuleChange(index, 'type', e.target.value)}
                            className="h-10 border border-input rounded-md px-2 text-sm bg-background"
                         >
                           <option value="fixed">LKR</option>
                           <option value="percentage">%</option>
                         </select>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                   <Button variant="outline" onClick={handleAddNewRule} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Rule
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="users" className="py-4">
                <div className="space-y-4">
                  <div>
                    <Label>Create New User</Label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2 items-end">
                      <div className="relative flex-1">
                         <Label className="text-xs">Username</Label>
                        <UserIcon className="absolute left-3 bottom-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="username" value={newUser.username} onChange={handleNewUserChange} placeholder="Username" className="pl-10" />
                      </div>
                      <div className="relative flex-1">
                        <Label className="text-xs">Password</Label>
                        <KeyRound className="absolute left-3 bottom-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="password" type="password" value={newUser.password} onChange={handleNewUserChange} placeholder="Password" className="pl-10" />
                      </div>
                      <div className="flex-1 sm:flex-none">
                         <Label className="text-xs">Role</Label>
                        <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddNewUser}><UserPlus className="mr-2 h-4 w-4"/> Add User</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Existing Users</Label>
                    <div className="border rounded-md p-2 space-y-2 max-h-40 overflow-y-auto">
                      {users.map(user => (
                        <div key={user.id} className="flex justify-between items-center bg-muted p-2 rounded-md">
                          <span className="text-sm font-medium">{user.username} <span className="text-xs text-muted-foreground">({user.role})</span></span>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(user.id)} disabled={users.length <= 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="data" className="py-4">
                <div className="space-y-4">
                  <Label>Data Management</Label>
                  <div className="p-4 border rounded-md border-destructive/50 space-y-3">
                     <h3 className="font-semibold text-destructive flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Danger Zone</h3>
                      <p className="text-sm text-muted-foreground">
                        These actions are not reversible. Please be certain before proceeding.
                      </p>
                      
                      <div className="space-y-2 p-3 border rounded-md">
                        <Label>Clear by Date Range</Label>
                        <div className="flex gap-2 items-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date range</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={!dateRange?.from || !dateRange?.to}>Clear</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete payment history within the selected date range. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDateRangeClear} className="bg-destructive hover:bg-destructive/90">
                                    Yes, clear history
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>

                      <div className="space-y-2 p-3 border rounded-md">
                        <Label>Clear by Month</Label>
                         <div className="flex gap-2 items-center">
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Filter by month" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="all">Select a month</SelectItem>
                                {availableMonths.map(month => (
                                    <SelectItem key={month} value={month}>
                                    {format(new Date(month), 'MMMM yyyy')}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={!selectedMonth || selectedMonth === 'all'}>Clear</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all payment history for the selected month. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMonthClear} className="bg-destructive hover:bg-destructive/90">
                                    Yes, clear history
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>

                       {(dateRange || (selectedMonth && selectedMonth !== 'all')) && (
                            <Button 
                            variant="ghost" 
                            onClick={resetFilters}
                            className="w-full sm:w-auto text-muted-foreground"
                            >
                            <FilterX className="mr-2 h-4 w-4" />
                                Reset Selection
                            </Button>
                        )}
                      
                      <div className="space-y-2 p-3 border rounded-md">
                        <Label>Clear All History</Label>
                        <p className="text-xs text-muted-foreground">This will remove all payment records permanently.</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="destructive">Clear All Payment History</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete your entire payment history. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onClearHistory()} className="bg-destructive hover:bg-destructive/90">
                                Yes, clear all history
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
