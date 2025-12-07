/**
 * @file src/components/common/ErrorState.tsx
 * @description Reusable error state component for API failures
 */

import { WifiOff, RefreshCw, AlertTriangle, ServerCrash, Clock } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: "network" | "server" | "notFound" | "rateLimit" | "generic";
  fullPage?: boolean;
}

const ErrorState = ({
  title,
  message,
  onRetry,
  type = "generic",
  fullPage = false,
}: ErrorStateProps) => {
  const errorConfig = {
    network: {
      icon: WifiOff,
      defaultTitle: "Connection Error",
      defaultMessage:
        "Unable to connect to the server. Please check your internet connection and try again.",
      iconColor: "text-red-500",
      bgColor: "bg-red-100",
    },
    server: {
      icon: ServerCrash,
      defaultTitle: "Server Error",
      defaultMessage:
        "Something went wrong on our end. Please try again later.",
      iconColor: "text-orange-500",
      bgColor: "bg-orange-100",
    },
    notFound: {
      icon: AlertTriangle,
      defaultTitle: "Not Found",
      defaultMessage: "The requested resource could not be found.",
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-100",
    },
    rateLimit: {
      icon: Clock,
      defaultTitle: "Too Many Requests",
      defaultMessage:
        "You've made too many requests. Please wait a moment and try again.",
      iconColor: "text-amber-500",
      bgColor: "bg-amber-100",
    },
    generic: {
      icon: AlertTriangle,
      defaultTitle: "Something went wrong",
      defaultMessage: "An unexpected error occurred. Please try again.",
      iconColor: "text-gray-500",
      bgColor: "bg-gray-100",
    },
  };

  const config = errorConfig[type];
  const Icon = config.icon;

  const content = (
    <div className="text-center py-12 px-4">
      <div
        className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
      >
        <Icon className={config.iconColor} size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {message || config.defaultMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 max-w-lg w-full">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">{content}</div>
  );
};

export default ErrorState;