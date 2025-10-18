'use client';

import React, { useState } from 'react';
import { Menu, Home, Calendar, UserPlus, Vote, Trophy } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { id: 'home', href: '/', label: 'Home', icon: Home },
  ];

  return (
    <>
      {/* Hamburger Menu Button - Fixed Top Right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 h-11 w-11 min-h-[44px] min-w-[44px] bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Slide-out Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full p-0 flex flex-col">
          <SheetHeader className="px-6 py-8 text-left">
            <SheetTitle className="text-3xl font-bold">shag-pallace</SheetTitle>
          </SheetHeader>
          
          <Separator />
          
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-4 px-4 py-3 min-h-[44px] text-lg rounded-lg hover:bg-accent transition-colors"
                    >
                      <Icon className="h-6 w-6" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Separator />
          
          <div className="px-6 py-6 text-sm text-muted-foreground">
            <p>Halloween Costume Contest App</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

