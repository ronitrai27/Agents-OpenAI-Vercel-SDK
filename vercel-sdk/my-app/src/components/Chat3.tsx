"use client";

import {
  Confirmation,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot, Send, Mail, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  DefaultChatTransport,
  type ToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";

// Define the tool types
type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

type SendEmailOutput = {
  success: boolean;
  message: string;
};

type SendEmailToolUIPart = ToolUIPart<{
  sendEmail: {
    input: SendEmailInput;
    output: SendEmailOutput;
  };
}>;

export function Chat3() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const suggestions = [
    "Send an email to john@example.com about the meeting",
    "Email sarah@company.com with project updates",
    "Draft an email to team@startup.com",
    "What are the latest trends in AI?",
    "How does machine learning work?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    console.log("Selected suggestion:", suggestion);
    setInput(suggestion);
  };

  const handleApproveEmail = (toolCallId: string, emailData: any) => {
    console.log("Approving email:", emailData);

    addToolResult({
      tool: "sendEmail",
      toolCallId: toolCallId,
      output: {
        success: true,
        message: `Email successfully sent to ${emailData.to}`,
      },
    });
  };

  const handleRejectEmail = (toolCallId: string) => {
    console.log("Rejecting email");

    addToolResult({
      tool: "sendEmail",
      toolCallId: toolCallId,
      output: {
        success: false,
        message: "Email sending cancelled by user",
      },
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="border-b p-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AI Chatbot with Email Agent
        </h1>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">
                  Start a conversation
                </h2>
                <p className="text-muted-foreground">
                  Ask me anything! I can also help you send emails.
                </p>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts?.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );

                      case "reasoning":
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full mb-4"
                            isStreaming={
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );

                      case "tool-sendEmail": {
                        const toolCallId = part.toolCallId;

                        // Show loading while streaming
                        if (part.state === "input-streaming") {
                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className="my-2 p-3 rounded-lg bg-gray-100 flex items-center gap-2"
                            >
                              <Mail className="w-4 h-4 animate-pulse" />
                              <span>Preparing email...</span>
                            </div>
                          );
                        }

                        // Show confirmation buttons when input is ready
                        if (part.state === "input-available") {
                          const args = part.input as {
                            to: string;
                            subject: string;
                            body: string;
                          };

                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className="my-4 border-2 border-blue-500 rounded-lg p-4 bg-blue-50"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                                  <Mail className="w-5 h-5" />
                                  <span>Email Confirmation Required</span>
                                </div>

                                <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                                  <div>
                                    <span className="font-semibold">To: </span>
                                    <code className="bg-gray-100 px-2 py-1 rounded">
                                      {args.to}
                                    </code>
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Subject:{" "}
                                    </span>
                                    <span>{args.subject}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Body:{" "}
                                    </span>
                                    <p className="mt-1 whitespace-pre-wrap text-gray-600 bg-gray-50 p-2 rounded">
                                      {args.body}
                                    </p>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600">
                                  Do you want to send this email?
                                </p>

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleRejectEmail(toolCallId)
                                    }
                                    className="flex-1"
                                  >
                                    <XIcon className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    variant="default"
                                    onClick={() =>
                                      handleApproveEmail(toolCallId, args)
                                    }
                                    className="flex-1"
                                  >
                                    <CheckIcon className="w-4 h-4 mr-2" />
                                    Send Email
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Show result after execution
                        if (part.state === "output-available") {
                          const result = part.output as {
                            success: boolean;
                            message: string;
                          };

                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className={`my-2 p-3 rounded-lg flex items-center gap-2 ${
                                result.success
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {result.success ? (
                                <CheckIcon className="w-4 h-4" />
                              ) : (
                                <XIcon className="w-4 h-4" />
                              )}
                              <span>{result.message}</span>
                            </div>
                          );
                        }

                        // Show error if something went wrong
                        if (part.state === "output-error") {
                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className="my-2 p-3 rounded-lg bg-red-50 text-red-700 flex items-center gap-2"
                            >
                              <XIcon className="w-4 h-4" />
                              <span>Error: {part.errorText}</span>
                            </div>
                          );
                        }

                        return null;
                      }

                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4 w-full">
        <Suggestions>
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              suggestion={suggestion}
              onClick={handleSuggestionClick}
            />
          ))}
        </Suggestions>
        <div className="flex gap-2 mt-5">
          <input
            value={input}
            className="w-full bg-gray-100 p-2 rounded-md"
            placeholder="Type your message..."
            onChange={(event) => {
              setInput(event.target.value);
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter" && input.trim()) {
                sendMessage({
                  parts: [{ type: "text", text: input }],
                });
                setInput("");
              }
            }}
          />
          <Button
            onClick={() => {
              if (input.trim()) {
                sendMessage({
                  parts: [{ type: "text", text: input }],
                });
                setInput("");
              }
            }}
            disabled={status !== "ready" || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
