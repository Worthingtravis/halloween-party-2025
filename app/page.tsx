"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { toast } = useToast()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Halloween App
          </h1>
          <p className="text-lg text-muted-foreground">
            Built with Next.js and shadcn/ui
          </p>
          <div className="flex gap-2 justify-center">
            <Badge variant="default">Next.js 15</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="outline">TypeScript</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>
                This is a demo of shadcn/ui components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Enter your name..." />
              <div className="flex gap-2">
                <Button 
                  onClick={() => toast({
                    title: "Success!",
                    description: "shadcn/ui is working perfectly! 🎉",
                  })}
                >
                  Show Toast
                </Button>
                <Button variant="outline">
                  Secondary
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
              <CardDescription>
                All these components are from shadcn/ui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  ✅ Button variants
                </p>
                <p className="text-sm text-muted-foreground">
                  ✅ Card layouts
                </p>
                <p className="text-sm text-muted-foreground">
                  ✅ Input fields
                </p>
                <p className="text-sm text-muted-foreground">
                  ✅ Toast notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  ✅ Badge components
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}