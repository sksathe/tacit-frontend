import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, Clock, MapPin, Users, FileText, Send } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface MeetingDetails {
  title: string;
  date: string | null;
  time: string | null;
  duration: number | null;
  location: string | null;
  attendees: string[] | null;
  agenda: string | null;
  notes: string | null;
}

const meetingDetailsSchema = z.object({
  title: z.string().trim().min(1, "Meeting title is required").max(200, "Title must be less than 200 characters"),
  date: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Meeting date is required",
    }),
  time: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", {
      message: "Meeting time is required",
    }),
  duration: z
    .number()
    .nullable()
    .refine((val) => val !== null && val > 0, {
      message: "Meeting duration must be greater than 0",
    }),
  location: z.string().nullable().optional(),
  attendees: z
    .array(z.string())
    .nullable()
    .refine((val) => val !== null && val.length > 0, {
      message: "At least one attendee is required",
    }),
  agenda: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const EmailToMeeting = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  const handleParse = async () => {
    if (!emailSubject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter an email subject.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-meeting-email", {
        body: {
          subject: emailSubject,
          body: emailBody,
        },
      });

      if (error) throw error;

      if (data && data.meetingDetails) {
        setMeetingDetails(data.meetingDetails);
        toast({
          title: "Success",
          description: "Email parsed successfully!",
        });
      } else {
        throw new Error("No meeting details returned");
      }
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToWebhook = async () => {
    if (!webhookUrl.trim() || !meetingDetails) {
      toast({
        title: "Missing Information",
        description: "Please enter a webhook URL and parse an email first.",
        variant: "destructive",
      });
      return;
    }

    // Validate webhook URL
    try {
      new URL(webhookUrl);
    } catch {
      toast({
        title: "Invalid Webhook URL",
        description: "Please enter a valid webhook URL (e.g., https://example.com/webhook)",
        variant: "destructive",
      });
      return;
    }

    // Validate meeting details
    try {
      meetingDetailsSchema.parse(meetingDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingDetails),
      });

      if (!response.ok) throw new Error("Webhook request failed");

      toast({
        title: "Success",
        description: "Meeting details sent to webhook successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send data to webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Login / Signup</h1>
            <p className="text-muted-foreground text-lg">
              Paste your email and let AI extract meeting details automatically
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Email Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Input
                </CardTitle>
                <CardDescription>Enter the email subject and body</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Team Sync - Next Monday at 2pm"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Paste the email content here..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="min-h-[300px]"
                  />
                </div>

                <Button onClick={handleParse} disabled={loading} className="w-full">
                  {loading ? "Extracting..." : "Extract Meeting Details"}
                </Button>
              </CardContent>
            </Card>

            {/* Meeting Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Meeting Details</CardTitle>
                <CardDescription>Review and edit the extracted information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {meetingDetails ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={meetingDetails.title || ""}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={meetingDetails.date || ""}
                          onChange={(e) => setMeetingDetails({ ...meetingDetails, date: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time
                        </Label>
                        <Input
                          id="time"
                          type="time"
                          value={meetingDetails.time || ""}
                          onChange={(e) => setMeetingDetails({ ...meetingDetails, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={meetingDetails.duration || ""}
                        onChange={(e) =>
                          setMeetingDetails({ ...meetingDetails, duration: parseInt(e.target.value) || null })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={meetingDetails.location || ""}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attendees" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Attendees (comma-separated)
                      </Label>
                      <Input
                        id="attendees"
                        value={meetingDetails.attendees?.join(", ") || ""}
                        onChange={(e) =>
                          setMeetingDetails({
                            ...meetingDetails,
                            attendees: e.target.value
                              .split(",")
                              .map((a) => a.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agenda">Agenda</Label>
                      <Textarea
                        id="agenda"
                        value={meetingDetails.agenda || ""}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, agenda: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={meetingDetails.notes || ""}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter an email and click "Extract Meeting Details" to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* JSON Output & Webhook Section */}
          {meetingDetails && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>JSON Output</CardTitle>
                  <CardDescription>Copy this JSON to use in your applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(meetingDetails, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Power Automate Integration
                  </CardTitle>
                  <CardDescription>Send meeting details to your Power Automate webhook</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook">Webhook URL</Label>
                    <Input
                      id="webhook"
                      placeholder="https://default2fb7e7d5ed0c4ce79d90267cf0d100.0b.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6be6b1419eac4ec780e84013bc589b13/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qoI415XohdHRhXAA4cHkbqUkge8Sip8KzE0mnQfMxj8"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSendToWebhook} disabled={loading} className="w-full">
                    Send to Webhook
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmailToMeeting;
