
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";

type NotificationType = "info" | "warning" | "success";

type Notification = {
  id: string;
  message: string;
  time: string;
  type: NotificationType;
};

// Placeholder notifications
const notifications: Notification[] = [
  {
    id: "1",
    message: "New user joined your organization",
    time: "10 minutes ago",
    type: "info",
  },
  {
    id: "2",
    message: "System update scheduled for tomorrow",
    time: "2 hours ago",
    type: "warning",
  },
  {
    id: "3",
    message: "Monthly report generated successfully",
    time: "1 day ago",
    type: "success",
  },
  {
    id: "4",
    message: "New feature available: AI Copilot",
    time: "3 days ago",
    type: "info",
  },
];

export function NotificationsWidget() {
  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-x-4">
        <div className="rounded-full bg-rubberband-light p-2">
          <Bell className="h-5 w-5 text-rubberband-primary" />
        </div>
        <div>
          <CardTitle>System Notifications</CardTitle>
          <CardDescription>Stay updated on system events</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {notifications.map((notification) => (
            <li key={notification.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
              {getIconForType(notification.type)}
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{notification.time}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
