import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Monitor, Settings, Users, Brain, Clock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";

const SessionDemo = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "AI Agent",
      content: "Hello! I'm excited to learn from your expertise today. I'll be acting as a new hire who wants to understand your processes. Could you start by giving me an overview of your main responsibilities?",
      timestamp: "10:00 AM",
      type: "ai"
    },
    {
      id: 2,
      sender: "SME",
      content: "Sure! I handle our customer escalation process. When a regular support ticket can't be resolved by tier 1 support, it comes to me. The key is knowing when to escalate versus when to dig deeper.",
      timestamp: "10:01 AM",
      type: "sme"
    },
    {
      id: 3,
      sender: "AI Agent", 
      content: "That's really helpful! Could you walk me through a specific example? What signals tell you whether to escalate or investigate further?",
      timestamp: "10:02 AM",
      type: "ai"
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addMessage = (content: string, type: 'ai' | 'sme') => {
    const newMessage = {
      id: messages.length + 1,
      sender: type === 'ai' ? 'AI Agent' : 'SME',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Setup
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Knowledge Extraction Session</h1>
              <p className="text-muted-foreground">Advanced Troubleshooting Procedures</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(sessionTime)}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Users className="mr-1 h-3 w-3" />
                2 participants
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video/Audio Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Panels */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-elegant">
                <CardContent className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-lg flex items-center justify-center relative">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">SME - Customer Success</p>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-primary">
                      <Mic className="mr-1 h-3 w-3" />
                      Speaking
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg flex items-center justify-center relative">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Brain className="h-8 w-8 text-accent" />
                      </div>
                      <p className="font-medium">AI Agent</p>
                      <p className="text-sm text-muted-foreground">New Hire Persona</p>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-chart-2">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      Listening
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Screen Share */}
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-4">
                <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Monitor className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="font-medium">Screen Share</p>
                    <p className="text-sm text-muted-foreground">SME can share their screen to demonstrate processes</p>
                    <Button variant="outline" size="sm">
                      <Monitor className="mr-2 h-4 w-4" />
                      Start Screen Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant={isRecording ? "destructive" : "secondary"}
                    size="lg"
                    onClick={() => setIsRecording(!isRecording)}
                    className="rounded-full w-12 h-12"
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  
                  <Button variant="secondary" size="lg" className="rounded-full w-12 h-12">
                    <Video className="h-5 w-5" />
                  </Button>
                  
                  <Button variant="secondary" size="lg" className="rounded-full w-12 h-12">
                    <Monitor className="h-5 w-5" />
                  </Button>
                  
                  <Button variant="secondary" size="lg" className="rounded-full w-12 h-12">
                    <Settings className="h-5 w-5" />
                  </Button>

                  <Button 
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow transition-smooth"
                    onClick={() => navigate("/knowledge-library")}
                  >
                    End Session & Generate Assets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat & Transcription */}
          <div className="space-y-6">
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                  Live Transcription
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          message.type === 'ai' ? 'text-accent' : 'text-primary'
                        }`}>
                          {message.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp}
                        </span>
                      </div>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Brain className="mr-2 h-4 w-4 text-accent" />
                  AI Insights
                </h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-primary">Key Topic Identified</p>
                    <p className="text-sm text-muted-foreground">Escalation decision criteria</p>
                  </div>
                  
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="text-sm font-medium text-accent">Follow-up Question</p>
                    <p className="text-sm text-muted-foreground">Ask about specific metrics used</p>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">Knowledge Gap</p>
                    <p className="text-sm text-muted-foreground">Process documentation needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDemo;