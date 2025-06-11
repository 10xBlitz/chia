import { cn } from "@/lib/utils";
import { ChatMessage } from "../hooks/use-realtime-chat";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
  sendingStatus?: "idle" | "sending" | "delivered";
  sendError?: string | null;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
  sendingStatus,
  sendError,
}: ChatMessageItemProps) => {
  return (
    <div
      className={`flex mt-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={cn("max-w-[75%] w-fit flex flex-col gap-1", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            <span className={"font-medium"}>{message.user.name}</span>
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            "py-2 px-3 rounded-xl text-sm w-fit",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {message.content}
        </div>
        {/* Status UI for last own message */}
        {isOwnMessage && sendingStatus === "sending" && (
          <span className="text-xs text-gray-400 mt-0.5">Sending...</span>
        )}
        {isOwnMessage && sendingStatus === "delivered" && (
          <span className="text-xs text-green-500 mt-0.5">Delivered</span>
        )}
        {isOwnMessage && sendError && (
          <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded mt-0.5">
            {sendError}
          </span>
        )}
      </div>
    </div>
  );
};
