import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Share2, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
              <MessageCircle className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to ChatSphere
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Seamless real-time communication with instant chat rooms, file sharing, and modern design
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-medium rounded-lg"
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <Users className="w-14 h-14 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4 text-card-foreground">Create Rooms</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create chat rooms instantly with unique IDs and shareable links for seamless collaboration
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <Share2 className="w-14 h-14 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4 text-card-foreground">Share & Join</h3>
              <p className="text-muted-foreground leading-relaxed">
                Join conversations effortlessly with a simple chat ID or invitation link
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <Shield className="w-14 h-14 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4 text-card-foreground">Secure & Private</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your conversations remain private and secure with room-based isolation
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground">
            Sign in to start creating and joining chat rooms
          </p>
        </div>
      </div>
    </div>
  );
}
