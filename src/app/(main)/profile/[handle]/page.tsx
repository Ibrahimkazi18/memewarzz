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
import { useRouter } from "next/navigation"
import { formatNumberShort } from "../../../../../utils/helper"


export default function ProfilePage() {
  const {profile} = useProfile();
  const { followersCount, followingCount } = useFollowStats(profile?.id)

  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-2">
            <AvatarImage src="/placeholder-user.jpg" alt="@mememaster" />
            <AvatarFallback>{profile?.username.split(" ")[0][0]}</AvatarFallback>
          </Avatar>

          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">MemeMaster</h1>

            <p className="text-muted-foreground text-lg">@mememaster_official</p>

            <p className="mt-2 max-w-md">
              Passionate meme creator and battle enthusiast. Bringing the freshest content to Memwarzz!
            </p>

            <div className="flex justify-center md:justify-start gap-6 mt-4 text-sm">
              <div>
                <span className="font-semibold text-lg">{formatNumberShort(followersCount)}</span> Followers
              </div>
              <div>
                <span className="font-semibold text-lg">{formatNumberShort(followingCount)}</span> Following
              </div>
              <div>
                <span className="font-semibold text-lg">87</span> Posts
              </div>
            </div>

            <div className="mt-4 flex justify-center md:justify-start gap-2">
              <Button>Follow</Button>
              <Button variant="outline">Message</Button>
            </div>

          </div>
        </div>

        <Separator className="my-8" />

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="battles">Battles</TabsTrigger>
            <TabsTrigger value="liked">Liked Memes</TabsTrigger>
            <TabsTrigger value="coins">Meme Coins</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Image
                      src={`/placeholder.svg?height=300&width=300&query=meme%20post%20${i + 1}`}
                      width={300}
                      height={300}
                      alt={`Meme post ${i + 1}`}
                      className="w-full h-48 object-cover bg-muted"
                    />
                  </CardContent>
                  <CardFooter className="p-3 text-sm">
                    <p className="truncate">A funny meme caption {i + 1}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="battles" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Your Battles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-0.5 bg-border">
                      <Image
                        src={`/placeholder.svg?height=150&width=225&query=meme%20battle%20left%20${i + 1}`}
                        width={225}
                        height={150}
                        alt={`Meme battle left ${i + 1}`}
                        className="w-full h-32 object-cover bg-muted"
                      />
                      <Image
                        src={`/placeholder.svg?height=150&width=225&query=meme%20battle%20right%20${i + 1}`}
                        width={225}
                        height={150}
                        alt={`Meme battle right ${i + 1}`}
                        className="w-full h-32 object-cover bg-muted"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 text-sm">
                    <p className="truncate">Battle #{i + 1}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="liked" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Liked Memes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Image
                      src={`/placeholder.svg?height=300&width=300&query=liked%20meme%20${i + 1}`}
                      width={300}
                      height={300}
                      alt={`Liked meme ${i + 1}`}
                      className="w-full h-48 object-cover bg-muted"
                    />
                  </CardContent>
                  <CardFooter className="p-3 text-sm">
                    <p className="truncate">A liked meme {i + 1}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="coins" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Your Meme Coins</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>DogeCoin 2.0</CardTitle>
                  <CardDescription>The next big thing in meme crypto.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Total Supply: 1,000,000,000</p>
                  <p className="text-sm text-muted-foreground">Liquidity: $50,000</p>
                  <Button size="sm" className="mt-4 w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>PepeCoin Classic</CardTitle>
                  <CardDescription>A timeless classic for true meme connoisseurs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Total Supply: 500,000,000</p>
                  <p className="text-sm text-muted-foreground">Liquidity: $25,000</p>
                  <Button size="sm" className="mt-4 w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6 text-center">
              <Button asChild>
                <Link href="/create-meme-coin">Create New Meme Coin</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
