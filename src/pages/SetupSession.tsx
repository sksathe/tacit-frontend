import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Brain, Calendar, Clock, Users, Send, CalendarIcon, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { SESSION_TYPE_NAME } from "@/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const WEBHOOK_URL = import.meta.env.VITE_POWER_AUTOMATE_WEBHOOK_URL || "";

const SetupSession = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    persona: "rachael-payment-ops",
    firstName: "",
    lastName: "",
    inviteEmail: "",
    sessionType: "guided",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPayload = () => ({
    title: formData.title,
    description: formData.description,
    persona: formData.persona,
    firstName: formData.firstName,
    lastName: formData.lastName,
    inviteEmail: formData.inviteEmail,
    sessionType: formData.sessionType,
    createdAt: new Date().toISOString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      if (!WEBHOOK_URL) {
        throw new Error("Missing Power Automate webhook URL. Set VITE_POWER_AUTOMATE_WEBHOOK_URL.");
      }
      const payload = getPayload();

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Invitation Sent!",
        description: `Knowledge extraction session invitation has been sent to ${formData.inviteEmail}`,
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error sending to webhook:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send invitation to Power Automate. Please check your webhook URL.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPayload = () => {
    const payload = JSON.stringify(getPayload(), null, 2);
    navigator.clipboard.writeText(payload);
    toast({
      title: "Copied to Clipboard",
      description: "Payload structure copied successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Brain className="w-4 h-4 mr-2" />
              Setup Knowledge Extraction Session
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold">
              Create Your <span className="bg-gradient-primary bg-clip-text text-transparent">{SESSION_TYPE_NAME}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Configure your AI agent and invite SMEs to share their valuable expertise
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Session Details */}
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Session Details
                </CardTitle>
                <CardDescription>Define the scope and context of your knowledge extraction session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Advanced Troubleshooting Procedures"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what knowledge needs to be captured..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={4}
                  />
                  <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      💡 Suggested key items for {formData.persona === "rachael-payment-ops" ? "Payment Ops" : "SOC 2"}:
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.persona === "rachael-payment-ops"
                        ? "Payment processing workflows, reconciliation procedures, vendor payment protocols, fraud detection processes, payment exceptions handling, compliance requirements"
                        : "Security controls implementation, audit evidence collection, compliance documentation, access control procedures, incident response protocols, policy enforcement"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select
                    value={formData.sessionType}
                    onValueChange={(value) => setFormData({ ...formData, sessionType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guided">AI-Guided</SelectItem>
                      <SelectItem value="freeform">Free-form</SelectItem>
                      <SelectItem value="structured">Structured Q&A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Configuration */}
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-accent" />
                  AI Agent Configuration
                </CardTitle>
                <CardDescription>Customize how the AI agent will interact with your SME</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="persona">Agent Persona</Label>
                  <Select
                    value={formData.persona}
                    onValueChange={(value) => setFormData({ ...formData, persona: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rachael-payment-ops">Rachael-Payment Ops Analyst</SelectItem>
                      <SelectItem value="ross-soc2">Ross the SOC 2 Compliance Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">
                      Selected Persona:{" "}
                      {formData.persona === "rachael-payment-ops"
                        ? "Rachael-Payment Ops Analyst"
                        : "Ross the SOC 2 Compliance Assistant"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.persona === "rachael-payment-ops"
                        ? "Rachael specializes in payment operations and will focus on payment processing workflows, compliance, and reconciliation procedures."
                        : "Ross is a SOC 2 compliance specialist who will focus on security controls, audit requirements, and compliance documentation."}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">💡 Key focus areas:</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.persona === "rachael-payment-ops"
                        ? "Payment gateways, ACH processing, wire transfers, payment reconciliation, chargeback management, PCI compliance, vendor onboarding, payment fraud prevention"
                        : "Access controls, encryption standards, vulnerability management, incident response plans, security monitoring, audit logging, third-party risk assessment, policy documentation"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invitation */}
          <Card className="border-0 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary-glow" />
                Invite SME
              </CardTitle>
              <CardDescription>Send an invitation to your Subject Matter Expert</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="inviteEmail">SME Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="expert@company.com"
                  value={formData.inviteEmail}
                  onChange={(e) => setFormData({ ...formData, inviteEmail: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate("/session/demo")}
              className="px-8"
            >
              <Clock className="mr-2 h-4 w-4" />
              Preview Session
            </Button>

            <Button
              type="submit"
              size="lg"
              className="bg-gradient-primary hover:shadow-glow transition-smooth px-8"
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sending..." : "Create & Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupSession;
