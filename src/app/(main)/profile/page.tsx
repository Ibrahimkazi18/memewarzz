"use client"

import ProtectedRoute from "@/components/protected-route"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useFollowStats from "@/hooks/useFollows"
import useProfile from "@/hooks/useProfile"
import Image from "next/image"
import Link from "next/link"
import { formatNumberShort } from "../../../../utils/helper" // Assuming this utility exists
import { Edit, Users, ImageIcon, DollarSign } from "lucide-react"

export default function ProfilePage() {
  const { profile } = useProfile()
  const { followersCount, followingCount } = useFollowStats(profile?.id)

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-primary shadow-md">
            <AvatarImage src="/placeholder.svg?height=160&width=160" alt="@mememaster" />
            <AvatarFallback>{profile?.username ? profile.username.split(" ")[0][0] : "U"}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-1 space-y-3">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
              <h1 className="text-3xl font-bold sm:text-4xl">
                {profile?.username || "User Name"}{" "}
                <span className="text-primary capitalize">| {profile?.role || "Member"}</span>
              </h1>
              <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent">
                <Edit className="w-4 h-4" /> Edit Profile
              </Button>
            </div>
            <p className="text-muted-foreground text-lg">@{profile?.handle || "user_handle"}</p>
            <p className="mt-2 max-w-xl text-base text-muted-foreground">
              Passionate meme creator and battle enthusiast. Bringing the freshest content to Memwarzz!
            </p>
            <div className="flex justify-center md:justify-start gap-8 mt-4 text-base">
              <div className="flex items-center gap-1">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-xl">{formatNumberShort(followersCount)}</span> Followers
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-xl">{formatNumberShort(followingCount)}</span> Following
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-xl">87</span> Posts
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 h-12">
            <TabsTrigger value="posts" className="text-base">
              Posts
            </TabsTrigger>
            <TabsTrigger value="battles" className="text-base">
              Battles
            </TabsTrigger>
            <TabsTrigger value="liked" className="text-base">
              Liked Memes
            </TabsTrigger>
            <TabsTrigger value="coins" className="text-base">
              Meme Coins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Your Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden group hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <Image
                      src={`/placeholder.svg?height=300&width=300&query=meme%20post%20${i + 1}`}
                      width={300}
                      height={300}
                      alt={`Meme post ${i + 1}`}
                      className="w-full h-48 object-cover bg-muted group-hover:scale-105 transition-transform duration-200"
                    />
                  </CardContent>
                  <CardFooter className="p-3 text-sm bg-card/80 backdrop-blur-sm">
                    <p className="truncate font-medium">A funny meme caption {i + 1}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="battles" className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Your Battles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden group hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-0.5 bg-border">
                      <Image
                        src={`/placeholder.svg?height=150&width=225&query=meme%20battle%20left%20${i + 1}`}
                        width={225}
                        height={150}
                        alt={`Meme battle left ${i + 1}`}
                        className="w-full h-32 object-cover bg-muted group-hover:scale-105 transition-transform duration-200"
                      />
                      <Image
                        src={`/placeholder.svg?height=150&width=225&query=meme%20battle%20right%20${i + 1}`}
                        width={225}
                        height={150}
                        alt={`Meme battle right ${i + 1}`}
                        className="w-full h-32 object-cover bg-muted group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 text-sm bg-card/80 backdrop-blur-sm">
                    <p className="truncate font-medium">Battle #{i + 1}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Liked Memes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden group hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <Image
                      src={`/placeholder.svg?height=300&width=300&query=liked%20meme%20${i + 1}`}
                      width={300}
                      height={300}
                      alt={`Liked meme ${i + 1}`}
                      className="w-full h-48 object-cover bg-muted group-hover:scale-105 transition-transform duration-200"
                    />
                  </CardContent>
                  <CardFooter className="p-3 text-sm bg-card/80 backdrop-blur-sm">
                    <p className="truncate font-medium">A liked meme {i + 1}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="coins" className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Your Meme Coins</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-xl">DogeCoin 2.0</CardTitle>
                  <CardDescription>The next big thing in meme crypto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Total Supply: <span className="font-medium">1,000,000,000</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Liquidity: <span className="font-medium">$50,000</span>
                  </p>
                  <Button size="sm" className="mt-4 w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-xl">PepeCoin Classic</CardTitle>
                  <CardDescription>A timeless classic for true meme connoisseurs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Total Supply: <span className="font-medium">500,000,000</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Liquidity: <span className="font-medium">$25,000</span>
                  </p>
                  <Button size="sm" className="mt-4 w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8 text-center">
              <Button asChild size="lg">
                <Link href="/create-meme-coin">
                  <DollarSign className="w-5 h-5 mr-2" /> Create New Meme Coin
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
