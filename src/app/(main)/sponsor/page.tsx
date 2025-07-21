import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

export default function SponsorPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 w-full">
      {" "}
      <h1 className="text-3xl font-bold">Sponsor Memwarzz</h1>
      {/* Current Sponsors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Our Valued Sponsors</CardTitle>
          <CardDescription>Companies that support the Memwarzz community.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Image
                src={`/placeholder.svg?height=60&width=120&query=company%20logo%20${i + 1}`}
                width={120}
                height={60}
                alt={`Sponsor Logo ${i + 1}`}
                className="object-contain h-12 w-24"
              />
              <span className="text-sm text-muted-foreground">Company {i + 1}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      {/* Main Sponsor Bidding Section */}
      <Card>
        <CardHeader>
          <CardTitle>Become the Main Sponsor</CardTitle>
          <CardDescription>Bid to have your logo prominently displayed on all meme battles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Image
              src="/placeholder.svg?height=80&width=160"
              width={160}
              height={80}
              alt="Current Main Sponsor"
              className="object-contain h-20 w-40 border rounded-md p-2 bg-muted"
            />
            <div>
              <p className="font-semibold">Current Main Sponsor:</p>
              <p className="text-muted-foreground">Acme Corp. (Bid: $5,000)</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="bid-amount">Your Bid (USD)</Label>
            <Input id="bid-amount" type="number" placeholder="e.g., 5500" min="0" />
          </div>
          <Button className="w-full">Place Bid</Button>
        </CardContent>
      </Card>
      {/* Upload Sponsor Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Your Sponsor Details</CardTitle>
          <CardDescription>Submit your company information and logo to become a sponsor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" placeholder="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input id="website" type="url" placeholder="https://www.acme.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input id="contact-email" type="email" placeholder="contact@acme.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Company Logo</Label>
            <Input id="logo-upload" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">Max file size: 2MB. Recommended: PNG, JPG.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea id="message" placeholder="Tell us more about your company and sponsorship goals." rows={4} />
          </div>
          <Button className="w-full">Submit Sponsorship Application</Button>
        </CardContent>
      </Card>
    </div>
  )
}
