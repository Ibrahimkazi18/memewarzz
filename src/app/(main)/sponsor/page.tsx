import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"
import { DollarSign, Handshake, Lightbulb, Mail, Upload } from "lucide-react"

export default function SponsorPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Sponsor Memwarzz</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Partner with us to support the vibrant Memwarzz community and get your brand seen by thousands of meme
            enthusiasts.
          </p>
          <Button size="lg" asChild>
            <Link href="#sponsor-application">Become a Sponsor</Link>
          </Button>
        </section>

        {/* Current Sponsors Section */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Our Valued Sponsors</CardTitle>
            <CardDescription>Companies that support the Memwarzz community.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-center py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Image
                  src={`/placeholder.svg?height=60&width=120&query=company%20logo%20${i + 1}`}
                  width={120}
                  height={60}
                  alt={`Sponsor Logo ${i + 1}`}
                  className="object-contain h-14 w-28 rounded-md border p-1 bg-background"
                />
                <span className="text-sm font-medium text-muted-foreground">Company {i + 1}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Sponsor Bidding Section */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Become the Main Sponsor</CardTitle>
            <CardDescription>Bid to have your logo prominently displayed on all meme battles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-muted rounded-lg border">
              <Image
                src="/placeholder.svg?height=80&width=160"
                width={160}
                height={80}
                alt="Current Main Sponsor"
                className="object-contain h-20 w-40 border rounded-md p-2 bg-background"
              />
              <div className="text-center sm:text-left">
                <p className="font-semibold text-lg">Current Main Sponsor:</p>
                <p className="text-muted-foreground">
                  Acme Corp. (Bid: <span className="font-bold text-primary">$5,000</span>)
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label htmlFor="bid-amount">Your Bid (USD)</Label>
              <Input id="bid-amount" type="number" placeholder="e.g., 5500" min="0" />
            </div>
            <Button className="w-full" size="lg">
              Place Bid
            </Button>
          </CardContent>
        </Card>

        {/* Why Sponsor Us Section */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Why Sponsor Memwarzz?</CardTitle>
            <CardDescription>Discover the benefits of partnering with our growing community.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50 border">
              <Lightbulb className="w-8 h-8 text-primary" />
              <h3 className="font-semibold text-lg">Brand Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Reach a highly engaged audience of meme creators and enthusiasts.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50 border">
              <Handshake className="w-8 h-8 text-primary" />
              <h3 className="font-semibold text-lg">Community Engagement</h3>
              <p className="text-sm text-muted-foreground">
                Connect directly with your target demographic through interactive content.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50 border">
              <DollarSign className="w-8 h-8 text-primary" />
              <h3 className="font-semibold text-lg">Impactful Support</h3>
              <p className="text-sm text-muted-foreground">
                Contribute to the growth of a unique and entertaining platform.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Sponsor Form */}
        <Card id="sponsor-application" className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sponsorship Application</CardTitle>
            <CardDescription>Submit your company information and logo to become a sponsor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="Acme Inc." />
            </div>
            <div className="space-y-3">
              <Label htmlFor="website">Website URL</Label>
              <Input id="website" type="url" placeholder="https://www.acme.com" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input id="contact-email" type="email" placeholder="contact@acme.com" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="logo-upload">Company Logo</Label>
              <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors">
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">
                  Click to upload or drag and drop (Max 2MB, PNG/JPG)
                </span>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png, image/jpeg"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="message">Additional Message (Optional)</Label>
              <Textarea id="message" placeholder="Tell us more about your company and sponsorship goals." rows={5} />
            </div>
            <Button className="w-full" size="lg">
              Submit Sponsorship Application
            </Button>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <section className="text-center space-y-4 p-6 bg-muted rounded-xl shadow-inner">
          <h2 className="text-2xl font-bold">Have Questions?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            If you have any specific inquiries about sponsorship opportunities, feel free to reach out to our team.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="mailto:sponsors@memwarzz.com">
              <Mail className="w-5 h-5 mr-2" /> Contact Us
            </Link>
          </Button>
        </section>
      </div>
    </ProtectedRoute>
  )
}
