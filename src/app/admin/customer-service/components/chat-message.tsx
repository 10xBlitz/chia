import { cn } from "@/lib/utils";
import { ChatMessage } from "../hooks/use-realtime-chat";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
  forceStatus?: "seen";
  sendingStatus?: "idle" | "sending" | "delivered";
  sendError?: string | null;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
  forceStatus,
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
        {/* Message status for last own message */}
        {isOwnMessage && (
          <span className="text-xs mt-0.5 ml-2">
            {sendError && (
              <span className="text-red-500">전송 실패{/* Send failed */}</span>
            )}
            {!sendError && forceStatus === "seen" && (
              <span className="text-blue-500">읽음{/* Seen */}</span>
            )}
            {!sendError && !forceStatus && sendingStatus === "sending" && (
              <span className="text-gray-400">전송 중{/* Sending */}</span>
            )}
            {!sendError && !forceStatus && sendingStatus === "delivered" && (
              <span className="text-gray-400">전달됨{/* Delivered */}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
