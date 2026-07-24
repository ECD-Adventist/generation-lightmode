import React, { useState } from "react";
import { Flag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const issueTypes = [
  "App is slow",
  "Page froze",
  "Can't post",
  "Feed not loading",
  "Images not loading",
  "Other",
];

export default function ReportProblemButton() {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let userEmail = "";
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        const user = await base44.auth.me();
        userEmail = user?.email || "";
      }

      await base44.entities.PerformanceReport.create({
        user_email: userEmail,
        page: window.location.pathname,
        issue_type: issueType,
        description,
        device_info: navigator.userAgent,
      });

      toast.success("Thanks! We're on it 🙏");
      setDescription("");
      setIssueType(issueTypes[0]);
      setOpen(false);
    } catch (error) {
      toast.error("Could not send report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        title="Report a problem"
        aria-label="Report a problem"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[4000] flex h-9 w-9 items-center justify-center rounded-full border border-slate-300/60 bg-slate-100/70 text-slate-500 shadow-sm backdrop-blur transition hover:bg-slate-200/90 hover:text-slate-700 md:bottom-4"
      >
        <Flag className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
            <DialogDescription>
              Tell us what happened so we can improve the experience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Issue type</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tell us more (optional)</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell us more (optional)"
                className="min-h-28 resize-none"
                maxLength={1000}
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Sending..." : "Send Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}